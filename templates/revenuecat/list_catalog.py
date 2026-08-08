#!/usr/bin/env python3
"""List RC apps, products, entitlements, offerings for the configured project."""

from __future__ import annotations

import json
import os

import catalog
from rc_client import paginate, project_path, require_config


def main() -> None:
    cfg = require_config()
    project_id = cfg["RC_PROJECT_ID"] or catalog.PROJECT_ID
    key = cfg["RC_API_KEY"]

    print(f"Project: {project_id}\n")

    for label, path, list_key in [
        ("Apps", project_path(project_id, "apps"), "items"),
        ("Products", project_path(project_id, "products"), "items"),
        ("Entitlements", project_path(project_id, "entitlements"), "items"),
        ("Offerings", project_path(project_id, "offerings"), "items"),
        ("Paywalls", project_path(project_id, "paywalls"), "items"),
    ]:
        try:
            items = paginate(path, list_key=list_key, api_key=key)
        except RuntimeError as err:
            print(f"## {label}\n  error: {err}\n")
            continue
        print(f"## {label} ({len(items)})")
        for item in items:
            summary = {
                "id": item.get("id"),
                "lookup_key": item.get("lookup_key"),
                "display_name": item.get("display_name") or item.get("name"),
                "store_identifier": item.get("store_identifier"),
                "type": item.get("type") or item.get("app_type"),
            }
            print(" ", json.dumps({k: v for k, v in summary.items() if v}, ensure_ascii=False))
        print()


if __name__ == "__main__":
    # Allow catalog.PROJECT_ID fallback
    if not os.environ.get("RC_PROJECT_ID") and catalog.PROJECT_ID.startswith("proj"):
        os.environ.setdefault("RC_PROJECT_ID", catalog.PROJECT_ID)
    main()
