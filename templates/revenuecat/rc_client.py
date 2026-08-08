"""
Shared RevenueCat API v2 client.

Env:
  RC_API_KEY or RC_KEY_FILE
  RC_PROJECT_ID
  RC_ENV_FILE (optional dotenv path)
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

API_BASE = "https://api.revenuecat.com/v2"


def _load_dotenv() -> None:
    path = os.environ.get("RC_ENV_FILE")
    candidates = []
    if path:
        candidates.append(Path(path))
    candidates.extend(
        [
            Path.cwd() / ".env.local",
            Path.cwd() / ".env",
            Path(__file__).resolve().parents[2] / ".env.local",
            Path(__file__).resolve().parents[2] / ".env",
        ]
    )
    for candidate in candidates:
        if not candidate.is_file():
            continue
        for line in candidate.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip("'").strip('"')
            if key and key not in os.environ:
                os.environ[key] = value
        break


def _api_key() -> str:
    key = (os.environ.get("RC_API_KEY") or "").strip()
    if key:
        return key
    key_file = os.environ.get("RC_KEY_FILE") or str(Path.home() / ".rc_api_key")
    path = Path(key_file).expanduser()
    if path.is_file():
        return path.read_text().strip()
    return ""


def require_config(*extra: str) -> dict[str, str]:
    _load_dotenv()
    required = ["RC_PROJECT_ID", *extra]
    missing = []
    out: dict[str, str] = {}
    key = _api_key()
    if not key:
        missing.append("RC_API_KEY or RC_KEY_FILE")
    else:
        out["RC_API_KEY"] = key
    for name in required:
        val = (os.environ.get(name) or "").strip()
        if not val:
            missing.append(name)
        else:
            out[name] = val
    if missing:
        raise SystemExit(f"Missing config: {', '.join(missing)}")
    return out


def request(
    method: str,
    path: str,
    *,
    body: dict[str, Any] | None = None,
    api_key: str | None = None,
) -> Any:
    key = api_key or _api_key()
    if not key:
        raise SystemExit("Missing RC_API_KEY / RC_KEY_FILE")
    url = f"{API_BASE}{path}"
    data = None
    headers = {
        "Authorization": f"Bearer {key}",
        "Accept": "application/json",
    }
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method.upper())
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{method.upper()} {path} → {err.code}: {detail}") from err


def project_path(project_id: str, *parts: str) -> str:
    bits = "/".join(urllib.parse.quote(p, safe="") for p in parts)
    return f"/projects/{urllib.parse.quote(project_id, safe='')}/{bits}"


def paginate(path: str, *, list_key: str, api_key: str | None = None) -> list[Any]:
    """Follow next_page when present; list_key is the array field name."""
    items: list[Any] = []
    cursor: str | None = None
    while True:
        q = path
        if cursor:
            sep = "&" if "?" in q else "?"
            q = f"{q}{sep}starting_after={urllib.parse.quote(cursor)}"
        payload = request("GET", q, api_key=api_key) or {}
        batch = payload.get(list_key) or payload.get("items") or []
        items.extend(batch)
        cursor = payload.get("next_page")
        if not cursor:
            # some responses use object pagination differently
            if not payload.get("has_more"):
                break
            if batch:
                cursor = batch[-1].get("id")
            else:
                break
        if not batch:
            break
    return items
