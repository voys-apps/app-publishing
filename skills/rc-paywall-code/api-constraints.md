# RevenueCat paywall API constraints

These return 400/422 with little detail. Validate before PATCH.

## Environment (required)

Scripts must read from env / `.env.local` and fail fast if missing:

- `RC_API_KEY` or readable `RC_KEY_FILE` (default `~/.wj_rc_key`)
- `RC_PROJECT_ID`
- `RC_PAYWALL_ID`

Do not hardcode project/paywall ids in shared libraries. Do not ask the user to
paste `sk_` secrets into chat when env already has them.

## Localization ids

Every `text_lid` and `url_lid` must be **exactly 10 characters**.

```python
# good — every text_lid / url_lid is exactly 10 chars
"tsubtitlew", "utermswj00"
# bad
"subtitle", "terms_url"
```

## Numbers and enums

- `font_size` must be an **integer** (not `14.0`).
- Stack `overflow` only accepts `"scroll"` (not `"vertical"`).
- `badge.style` only accepts `"nested"`. Prefer negative-margin children instead of badges for ribbons.

## Stacks

- A `zlayer` stack still requires a `distribution` value.
- Prefer `alignment: "top"` / `"center"` explicitly when overlaying.

## Sticky footer

```json
{
  "id": "ftr0001",
  "type": "footer",
  "stack": { }
}
```

- Outer field name: `sticky_footer`
- Inner `type`: **`footer`** (not `sticky_footer`)

## Overrides

Supported condition example:

```json
{ "conditions": [{ "type": "selected" }], "properties": { } }
```

There is **no** screen-size condition (`compact`, `phone`, etc.). Short-device
layouts need sticky footer + scroll, not conditional trees.

Icon selected-state: put unselected `icon_name` / `color` / `formats` on the
base icon; override those three when `selected`.

## Draft PATCH

- `default_locale` is required every time.
- `revision` must match the current draft; if draft is null after publish, use
  the published revision (or `0`).

## Publish (REST, no MCP)

```
POST /projects/{project_id}/paywalls/{paywall_id}/actions/publish
POST /projects/{project_id}/paywalls/{paywall_id}/actions/unpublish
```

Use `publish_paywall.py` / `rc_api.publish_paywall()`. Only when the user
explicitly asks to go live. After publish the draft slot is often empty.

## Media

- Base64 payload cap ≈ **2,796,204** characters.
- Over that → re-export smaller (WebP or JPEG), never a different endpoint.
- Upload `content_type`: `image/png` | `image/jpeg` | **`image/webp`**
  (API accepts WebP; prefer it for UI art with alpha).
- RC still returns `formats.webp` / `webp_low_res` / `heic` even when the
  original was already WebP — wire all of them into `source.light`.
- Resize to ~3× on-screen pt **before** upload. Do not upload 300px icons for
  12–20pt UI chrome; that is the main paywall load regression.
- Image `source` needs light (and usually dark) URL sets from the upload
  response formats.

## Preview quirks

`render-paywall-screenshot` often:

- Omits the Restore Purchases control
- Leaves `{{ product.relative_discount }}` blank

Both still work in the app / real paywall viewer.
