#!/usr/bin/env python3
"""
Idempotent-ish bootstrap: create missing products, entitlement, offerings, packages.

Usage:
  python3 bootstrap_catalog.py --dry-run
  python3 bootstrap_catalog.py

Does not publish paywalls. Create store SKUs in Play/ASC before running.
"""

from __future__ import annotations

import argparse
import os
from typing import Any

import catalog
from rc_client import paginate, project_path, request, require_config


def _index_by(items: list[dict[str, Any]], *keys: str) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for item in items:
        for key in keys:
            val = item.get(key)
            if val:
                out[str(val)] = item
    return out


def _is_conflict(err: RuntimeError) -> bool:
    msg = str(err)
    return "409" in msg or "already" in msg.lower() or "conflict" in msg.lower()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not os.environ.get("RC_PROJECT_ID") and catalog.PROJECT_ID.startswith("proj"):
        os.environ.setdefault("RC_PROJECT_ID", catalog.PROJECT_ID)

    cfg = require_config()
    project_id = cfg["RC_PROJECT_ID"]
    key = cfg["RC_API_KEY"]
    dry = args.dry_run

    products = paginate(project_path(project_id, "products"), list_key="items", api_key=key)
    entitlements = paginate(
        project_path(project_id, "entitlements"), list_key="items", api_key=key
    )
    offerings = paginate(project_path(project_id, "offerings"), list_key="items", api_key=key)

    by_store_id = _index_by(products, "store_identifier")
    by_ent_lookup = _index_by(entitlements, "lookup_key")
    by_off_lookup = _index_by(offerings, "lookup_key")

    # key → list of RC product ids (one per store)
    created_product_ids: dict[str, list[str]] = {row["key"]: [] for row in catalog.PRODUCTS}

    for row in catalog.PRODUCTS:
        for store_key, store_identifier in row["stores"].items():
            app_id = catalog.APPS.get(store_key)
            if not app_id or app_id.endswith("_example"):
                print(f"skip product {row['key']} / {store_key}: set APPS[{store_key!r}] in catalog.py")
                continue
            existing = by_store_id.get(store_identifier)
            if existing:
                print(f"✓ product exists {store_identifier} → {existing.get('id')}")
                created_product_ids[row["key"]].append(existing["id"])
                continue
            body = {
                "store_identifier": store_identifier,
                "app_id": app_id,
                "type": row["type"],
                "display_name": row.get("display_name"),
            }
            if dry:
                print(f"[dry-run] POST product {body}")
                continue
            try:
                created = request(
                    "POST",
                    project_path(project_id, "products"),
                    body=body,
                    api_key=key,
                )
                pid = created.get("id")
                print(f"✓ created product {store_identifier} → {pid}")
                created_product_ids[row["key"]].append(pid)
                by_store_id[store_identifier] = created
            except RuntimeError as err:
                if _is_conflict(err):
                    print(f"~ conflict product {store_identifier}: {err}")
                else:
                    raise

    # Entitlement
    ent = by_ent_lookup.get(catalog.ENTITLEMENT["lookup_key"])
    if not ent:
        body = {
            "lookup_key": catalog.ENTITLEMENT["lookup_key"],
            "display_name": catalog.ENTITLEMENT["display_name"],
        }
        if dry:
            print(f"[dry-run] POST entitlement {body}")
            ent_id = None
        else:
            ent = request(
                "POST",
                project_path(project_id, "entitlements"),
                body=body,
                api_key=key,
            )
            ent_id = ent["id"]
            print(f"✓ created entitlement {body['lookup_key']} → {ent_id}")
    else:
        ent_id = ent["id"]
        print(f"✓ entitlement exists {catalog.ENTITLEMENT['lookup_key']} → {ent_id}")

    attach_ids: list[str] = []
    for row in catalog.PRODUCTS:
        if row.get("attach_to_entitlement"):
            attach_ids.extend(created_product_ids.get(row["key"]) or [])
    if ent_id and attach_ids:
        if dry:
            print(f"[dry-run] attach to entitlement {ent_id}: {attach_ids}")
        else:
            try:
                request(
                    "POST",
                    project_path(project_id, "entitlements", ent_id, "actions", "attach_products"),
                    body={"product_ids": attach_ids},
                    api_key=key,
                )
                print(f"✓ attached {len(attach_ids)} products to entitlement")
            except RuntimeError as err:
                if _is_conflict(err):
                    print(f"~ attach entitlement: {err}")
                else:
                    raise

    # Offerings + packages
    for off in catalog.OFFERINGS:
        existing_off = by_off_lookup.get(off["lookup_key"])
        if existing_off:
            offering_id = existing_off["id"]
            print(f"✓ offering exists {off['lookup_key']} → {offering_id}")
        else:
            body = {"lookup_key": off["lookup_key"], "display_name": off["display_name"]}
            if dry:
                print(f"[dry-run] POST offering {body}")
                offering_id = None
            else:
                created_off = request(
                    "POST",
                    project_path(project_id, "offerings"),
                    body=body,
                    api_key=key,
                )
                offering_id = created_off["id"]
                by_off_lookup[off["lookup_key"]] = created_off
                print(f"✓ created offering {off['lookup_key']} → {offering_id}")

        if not offering_id and not dry:
            continue

        # list packages for offering
        packages: list[dict[str, Any]] = []
        if offering_id:
            try:
                packages = paginate(
                    project_path(project_id, "offerings", offering_id, "packages"),
                    list_key="items",
                    api_key=key,
                )
            except RuntimeError:
                packages = []
        by_pkg = _index_by(packages, "lookup_key")

        for pkg in off["packages"]:
            existing_pkg = by_pkg.get(pkg["lookup_key"])
            if existing_pkg:
                package_id = existing_pkg["id"]
                print(f"  ✓ package exists {pkg['lookup_key']} → {package_id}")
            else:
                body = {
                    "lookup_key": pkg["lookup_key"],
                    "display_name": pkg["display_name"],
                }
                if dry or not offering_id:
                    print(f"  [dry-run] POST package {body}")
                    package_id = None
                else:
                    created_pkg = request(
                        "POST",
                        project_path(project_id, "offerings", offering_id, "packages"),
                        body=body,
                        api_key=key,
                    )
                    package_id = created_pkg["id"]
                    print(f"  ✓ created package {pkg['lookup_key']} → {package_id}")

            product_ids = created_product_ids.get(pkg["product_key"]) or []
            if package_id and product_ids:
                products_body = [
                    {"product_id": pid, "eligibility_criteria": "all"} for pid in product_ids
                ]
                if dry:
                    print(f"  [dry-run] attach products to package {package_id}: {products_body}")
                else:
                    try:
                        request(
                            "POST",
                            project_path(
                                project_id, "packages", package_id, "actions", "attach_products"
                            ),
                            body={"products": products_body},
                            api_key=key,
                        )
                        print(f"  ✓ attached products to {pkg['lookup_key']}")
                    except RuntimeError as err:
                        if _is_conflict(err):
                            print(f"  ~ attach package: {err}")
                        else:
                            raise

    print("\nDone. Next: Hosted UI via rc-launchpad (publish only on explicit ask).")


if __name__ == "__main__":
    main()
