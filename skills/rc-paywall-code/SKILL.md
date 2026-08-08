---
name: rc-paywall-code
description: >-
  Build and iterate RevenueCat Hosted UI paywalls as code via REST API v2:
  upload media, PATCH component trees, handle selected-state overrides, sticky
  footers, and localization. Use when the user asks to create or edit a
  RevenueCat paywall, match a mockup with custom PNGs, fix paywall layout via
  API, or mentions paywall-as-code / rc-paywall-code / RC paywall scripts / hosted paywall
  components.
---

# RevenueCat Paywall as Code

Build Hosted UI paywalls by uploading assets and PATCHing the component JSON
with **Python** scripts. Do **not** rely on the Paywall AI Editor when the user
already has PNGs — it generates its own art and cannot place existing files.

**Install** (preferred — part of the publishing toolkit):

```bash
npx skills add voys-apps/app-publishing --skill rc-paywall-code
# or full toolkit (Play + RC):
npx skills add voys-apps/app-publishing -g
```

Legacy single-skill repo: `npx skills add voys-apps/rc-paywall-code`

Use this skill in **any** project. If the repo already has scripts under
`scripts/revenuecat-paywall/` (or similar), prefer those; otherwise scaffold the
same pattern in Python (`.py`). Do not scaffold Node/JS for this skill unless
the user explicitly asks.

## When to use which tool

| Need | Tool |
| --- | --- |
| Upload images, PATCH draft, save revision | REST API v2 + Python scripts |
| Publish / unpublish draft | REST `…/paywalls/{id}/actions/publish` via `publish_paywall.py` |
| List offerings / products | RevenueCat MCP when available (optional) |
| Visual check after a draft save | MCP `render-paywall-screenshot` (optional) or dashboard builder |
| Fine pixel layout from custom art | Code + REST (this skill) |

MCP is optional. Media upload, draft PATCH, and **publish** all work over REST —
do not require MCP to ship a paywall.

## Consult official API docs when writing Python

**Required before generating or changing Python that talks to RevenueCat**
(`rc_api.py`, new endpoints, request bodies, response parsing):

1. Open / fetch the official REST API v2 docs — do **not** invent paths or
   payloads from memory:
   - Overview: https://www.revenuecat.com/docs/api-v2
   - Paywall tag (GET/PATCH paywall, publish, unpublish):
     https://www.revenuecat.com/docs/api-v2#tag/Paywall
   - Media / `media_assets` upload under the same API v2 docs
2. Confirm HTTP method, path
   (`/projects/{project_id}/paywalls/{paywall_id}/actions/publish`, etc.),
   auth (`Bearer` V2 secret), and JSON field names against the docs.
3. Then apply this skill’s recipes:
   [python-patterns.md](python-patterns.md) (code shape) and
   [api-constraints.md](api-constraints.md) (400/422 traps).

If docs and this skill disagree on an endpoint or field, **prefer the live API
docs**, then update the skill notes if the docs are clearly right.

Use `WebFetch` / `WebSearch` on those URLs in the same turn you scaffold or
edit API client code.

## Workflow

```
Task Progress:
- [ ] 1. Auth + locate offering / paywall ids
- [ ] 2. Upload (or reuse) media → asset manifest
- [ ] 3. Build component tree + localizations
- [ ] 4. PATCH draft (read revision first)
- [ ] 5. Screenshot / device preview; iterate
- [ ] 6. Publish only when the user explicitly asks
```

## Required env (validate before any API call)

Read config from the environment (and optionally `.env.local` / `.env`).
**Do not ask the user to paste secrets into chat** if they already exist in env.

| Variable | Required | Purpose |
| --- | --- | --- |
| `RC_API_KEY` | yes* | V2 secret (`sk_...`), Project configuration Read & write |
| `RC_KEY_FILE` | alt* | Path to a file containing the secret (default `~/.wj_rc_key`) |
| `RC_PROJECT_ID` | yes | e.g. `proj8ebf6fff` |
| `RC_PAYWALL_ID` | yes | e.g. `pw5cab9e30cba147a3` |
| `RC_ENV_FILE` | no | Explicit dotenv path |

\* Either `RC_API_KEY` or a readable key file is required.

Before the first PATCH in a session, run the project's `require_config()` (or
equivalent) so missing vars fail fast with a clear list. If validation fails,
tell the user exactly which vars to set — do not invent ids.

```bash
export RC_API_KEY=sk_...
export RC_PROJECT_ID=proj...
export RC_PAYWALL_ID=pw...
# or put RC_PROJECT_ID / RC_PAYWALL_ID in .env.local and keep the secret in RC_KEY_FILE
```

Never commit the secret. Never put it in `EXPO_PUBLIC_*` env vars.
SDK public keys (`appl_` / `goog_`) are separate and safe for the client.

### 1. Auth

Secret key: Project settings → API keys → New **V2** secret with
`Project configuration: Read & write`. Load via env as above.

### 2. Media (resize + WebP before upload)

`POST /projects/{project_id}/media_assets` with `filename`, `content_type`,
`file_data_base64`. Accepted `content_type` values include `image/png`,
`image/jpeg`, and **`image/webp`**. Response gives `asset_base_url` + `formats`
— build the source object the image component expects (`original`, `webp`,
`heic`, sizes).

RC always derives `webp` / `webp_low_res` / `heic` from whatever you upload.
That alone is **not** enough for a fast paywall: oversized PNG exports
(shield/crown at 300px for a 12–20pt icon) still bloat the CDN `original` and
slow first paint if the client falls back.

**When generating or editing `upload_assets.py` / `rc_api.upload_media`:**

1. Resize each asset to ~**3×** its on-screen pt width from `build_paywall.py`
   (`image(m, "crown", 20, 16)` → max width ≈ 80).
2. Re-encode UI art to **WebP** (`quality≈75`, Pillow `method=6`) before
   upload; set `content_type` to `image/webp` when the filename ends in
   `.webp`.
3. Full-bleed portrait backgrounds: ~2–2.5× phone resolution (e.g. 975×2110),
   WebP or JPEG `quality≈72` — do not ship raw multi‑MB landscape PNGs.
4. Keep a local manifest `key → urls/dimensions` so layout rebuilds skip
   re-upload.

Hard limit: ~2.8M base64 chars. Over that → smaller WebP/JPEG, never invent
a different upload API. Full recipe: [python-patterns.md](python-patterns.md)
§ `upload_assets.py`.

### 3. Component tree shape

Root payload for draft PATCH:

```json
{
  "revision": "<current>",
  "default_locale": "en_US",
  "automatically_scale_font_size": true,
  "components_config": {
    "base": {
      "background": { "type": "color", "value": "..." },
      "header": null,
      "stack": {},
      "sticky_footer": null
    }
  },
  "components_localizations": {
    "en_US": { "txxxxxxxxx": "..." }
  }
}
```

Sticky footer (when used):

```json
"sticky_footer": {
  "id": "ftr0001",
  "type": "footer",
  "stack": {}
}
```

`type` must be **`footer`**, not `sticky_footer`.

### 4. Layout patterns that work

**Short phones (iPhone SE):** put the purchase button in a sticky footer;
scroll the body (`overflow: "scroll"` on the root stack). There is **no**
screen-size override condition.

**Package selection chrome:** base style = unselected (thin border, empty
radio). Apply gold border / filled check via `overrides` with
`conditions: [{ "type": "selected" }]`. Never bake the selected look into only
the default package’s base styles or the other package cannot look selected.

**Overlapping art** (ribbons, plaques): prefer `direction: "zlayer"` with
`alignment: "top"` / negative margins. Equal-height package cards must share
one fixed height; do not wrap only one package in an extra zlayer that grows.

**CTA:** prefer a **flat** green `purchase_button` (bg + radius + crown + label).
Do not use `cta-green` PNG on the paywall — RC crops it. See
[python-patterns.md](python-patterns.md).

**Product prices:** use variables (`{{ product.price_per_period }}`,
`{{ product.relative_discount }}`, etc.), never hardcode store prices.

### 5. Iterate

1. Change layout code / DSL
2. `PATCH` draft (`python3 build_paywall.py`)
3. Preview (MCP screenshot or dashboard builder)
4. Repeat
5. Publish **only on explicit user approval** via REST:

```bash
PYTHONPATH=scripts/revenuecat-paywall python3 scripts/revenuecat-paywall/publish_paywall.py
# POST /projects/{id}/paywalls/{id}/actions/publish
```

Do **not** use MCP `publish-paywall` when the Python script is available — same
endpoint, no MCP dependency.

After publish, draft may be empty — next PATCH revision continues from the
published revision.

## Scaffold (new project)

**Before writing any new `.py` file, read [python-patterns.md](python-patterns.md)**
— endpoints, DSL signatures, layout skeletons, illustrated-CTA sizing, and
publish CLI. That file is the recipe; this section is only the checklist.

Minimal module set (Python):

| File | Role |
| --- | --- |
| `rc_api.py` | Auth, GET/PATCH paywall, upload media, draft revision, publish |
| `components.py` | DSL: `stack`, `text`, `image`, `package`, `icon`, `selected_override` |
| `upload_assets.py` | Resize + WebP-encode art → upload → manifest JSON |
| `build_paywall.py` | Layout + localizations → `save_draft` |
| `publish_paywall.py` | Promote draft → live (`actions/publish`) |

```bash
PYTHONPATH=scripts/revenuecat-paywall python3 scripts/revenuecat-paywall/upload_assets.py <assets-dir> /tmp/wj_assets.json
PYTHONPATH=scripts/revenuecat-paywall python3 scripts/revenuecat-paywall/build_paywall.py /tmp/wj_assets.json
# only when the user asks to go live:
PYTHONPATH=scripts/revenuecat-paywall python3 scripts/revenuecat-paywall/publish_paywall.py
```

If the repo already has `scripts/revenuecat-paywall/*.py`, **edit those** —
do not reinvent the DSL. If scaffolding elsewhere, copy shapes from
`python-patterns.md` (or from a known-good repo), then strip app-specific
ids/copy/assets.

Agents must know how to write these scripts from the skill alone: **first**
check the [official API v2 docs](https://www.revenuecat.com/docs/api-v2#tag/Paywall),
then use `python-patterns.md` for code shape and
[api-constraints.md](api-constraints.md) for 400/422 traps.

## Existing project scripts

If the current repo already has `scripts/revenuecat-paywall/` (or similar),
**reuse those files** instead of scaffolding from scratch. Prefer project env
vars (`RC_API_KEY`, `RC_PROJECT_ID`, `RC_PAYWALL_ID`) and never commit secrets.

## Hard API constraints

Full list: [api-constraints.md](api-constraints.md). Read it before the first
PATCH in a session. For endpoint/payload authorship, also read the official
[API v2 Paywall docs](https://www.revenuecat.com/docs/api-v2#tag/Paywall) first.

## Do not

- Scaffold Node/JS for paywall-as-code unless the user asks
- Commit API secrets or put V2 secrets in Expo public env
- Publish without explicit user ask
- Use AI Editor when custom PNGs must be placed
- Assume dashboard preview equals device (Restore link / discount vars often blank in screenshots)
