# Python patterns for paywall-as-code

Read this before scaffolding or editing scripts. Prefer copying from an existing
`scripts/revenuecat-paywall/` in the repo; if none exists, recreate these shapes.

## Module map

| File | Must export / do |
| --- | --- |
| `rc_api.py` | `require_config()`, `upload_media()`, `get_paywall()`, `draft_revision()`, `save_draft()`, `publish_paywall()`, `unpublish_paywall()` |
| `components.py` | `uid`, `col`, `box`, `sz`, `border`, `shadow`, `image`, `text`, `icon`, `stack`, `button`, `package`, `purchase_button`, `selected_override` |
| `build_paywall.py` | `build(manifest) -> components_config`; `__main__` calls `save_draft` |
| `upload_assets.py` | Resize + WebP-encode → upload → manifest JSON `{ key: { original, webp, …, width, height } }` |
| `publish_paywall.py` | CLI → `publish_paywall()` (only when user asks) |

Run with `PYTHONPATH=scripts/revenuecat-paywall` (or `cd` into that folder).
Pillow required for resize/WebP (`pip3 install pillow`).

## Generating Python (agents)

When the user asks to scaffold or change paywall scripts:

1. **API client first** — fetch
   [API v2 Paywall / media docs](https://www.revenuecat.com/docs/api-v2#tag/Paywall);
   do not invent paths or body fields.
2. **Scaffold or edit `.py` only** (not Node) unless the user asks otherwise.
3. **Media path** — always generate the resize + WebP step in
   `upload_assets.py` (below). Never upload raw multi‑MB design exports as-is.
4. **Validate env** via `require_config()` before any HTTP call.
5. **Publish** only when the user explicitly asks (`publish_paywall.py`).

## `rc_api.py` — endpoints

```
API_BASE = "https://api.revenuecat.com/v2"
Authorization: Bearer {RC_API_KEY}

POST /projects/{pid}/media_assets
     body: { filename, content_type, file_data_base64 }
     content_type: image/png | image/jpeg | image/webp
GET  /projects/{pid}/paywalls/{pwid}?expand=components
PATCH /projects/{pid}/paywalls/{pwid}
     body: { revision, components_config, components_localizations,
             default_locale, automatically_scale_font_size, name? }
POST /projects/{pid}/paywalls/{pwid}/actions/publish
POST /projects/{pid}/paywalls/{pwid}/actions/unpublish
```

Load `.env.local` / `.env` without overwriting existing env. Fail fast via
`require_config()` listing every missing var. Never hardcode project/paywall ids
or secrets in the client module.

`upload_media` must set `content_type` from the filename (include WebP):

```python
lower = name.lower()
if lower.endswith((".jpg", ".jpeg")):
    content_type = "image/jpeg"
elif lower.endswith(".webp"):
    content_type = "image/webp"
else:
    content_type = "image/png"
```

Return the dict an image `source.light` needs:

```python
{
  "original": f"{base}/{object_name}",
  "webp": f"{base}/{formats['webp']['object_name']}",
  "webp_low_res": f"{base}/{formats['webp_low_res']['object_name']}",
  "heic": f"{base}/{formats['heic']['object_name']}",
  "heic_low_res": f"{base}/{formats['heic_low_res']['object_name']}",
  "width": original_width,
  "height": original_height,
}
```

`draft_revision()`: use `components.draft.revision` if draft exists, else
`components.published.revision` (or `0`) after a publish cleared the draft.

## `upload_assets.py` — resize + WebP before upload

RC derives WebP on the CDN, but uploading huge PNGs still hurts load time
(large `original`, slower uploads, fatter derivatives). Generate this pipeline
whenever scaffolding or optimizing media:

```python
from PIL import Image

WEBP_QUALITY = 75

# Max pixel width ≈ 3× on-screen pt from build_paywall.py
# e.g. image(m, "crown", 20, 16) → MAX_WIDTH["crown"] = 80
MAX_WIDTH = {
    "back": 144,
    "logo": 280,
    "banner": 900,
    "plaque": 612,
    "best_deal": 200,
    "crown": 80,
    "shield": 48,
    "hero": 456,
    "icon_hearts": 120,
    # …one entry per key used in the layout
}

def compress_for_upload(key, src_path, work_dir):
    image = Image.open(src_path)
    max_w = MAX_WIDTH.get(key)
    if max_w and image.width > max_w:
        height = max(1, int(round(image.height * max_w / image.width)))
        image = image.resize((max_w, height), Image.LANCZOS)
    out = f"{work_dir}/{key}.webp"
    image.convert("RGBA").save(out, format="WEBP", quality=WEBP_QUALITY, method=6)
    return out

# Portrait background: ~2–2.5× phone (e.g. 975×2110), WebP/JPEG quality ≈72
# Then: manifest[key] = rc_api.upload_media(path, filename=f"wj_{key}.webp")
```

Rules:

- Derive `MAX_WIDTH` from actual `image(..., width_pt)` / `height` in
  `build_paywall.py` — do not guess from export file dimensions.
- Mockup crops that are tiny (~56px tiles) must be **upscaled** to
  `MAX_WIDTH` before encode so @3x screens stay sharp.
- Only assets referenced by the component tree are downloaded by the client;
  still compress everything you upload.
- After changing art: re-run `upload_assets.py`, then `build_paywall.py`
  (manifest URLs change). Do not publish unless asked.

## `components.py` — DSL shapes

```python
def uid(prefix="c"): ...          # e.g. "stk0001"
def col(hex8): ...                # {"light": {"type":"hex","value":...}, "dark": ...}
def box(top=0, bottom=0, leading=0, trailing=0): ...
def sz(width="fit", height="fit"):
    # int → {"type":"fixed","value":n}; "fill"|"fit" → {"type": that, "value": None}

def stack(children, direction="vertical", align="center", dist="start",
          spacing=0, width="fill", height="fit", bg=None, bg_image=None,
          manifest=None, bdr=None, radius=0, bottom_radius=None,
          margin=None, padding=None, shdw=None, overrides=None,
          scroll=None, name=""):
    # dimension.type = direction ("vertical"|"horizontal"|"zlayer")
    # overflow = "scroll" only when scroll is set — do NOT set on the root on
    # Android 9.x (RC already verticalScrolls the root; nested scroll crashes)
    # padding/margin sides must be >= 0 (Android Compose PaddingValues crash)
    # bg_image → background { type:"image", fit_mode:"fill", value: source(...) }

def image(manifest, key, width="fill", height="fit", fit="fit", margin=None, padding=None)
    # padding/margin sides must be >= 0 — never box(top=-20) on images or stacks
def text(lid, size=14, weight="regular", weight_int=400, color="#000000ff",
         align="center", width="fill", margin=None, padding=None)
    # text_lid MUST be exactly 10 characters; font_size MUST be int

def package(package_id, name, child_stack, selected)
def purchase_button(child_stack, name="Purchase")
def button(action, child_stack, name="")
def selected_override(properties):
    return [{"conditions": [{"type": "selected"}], "properties": properties}]
```

Hex colors are 8-digit (`#RRGGBBAA`).

## `build_paywall.py` — layout skeleton

```python
EN = {"tctawj0000": "Start Premium", ...}   # every key len == 10
TR = {...}

def build(manifest):
    # Android 9.x: RC wraps this in verticalScroll+weight. Do not also
    # overflow-scroll or height-fill the root (infinity-height crash).
    root = stack(
        [...],
        bg_image="bg",
        manifest=manifest,
        height="fit",
        name="Content",
    )
    return {
        "base": {
            "background": {"type": "color", "value": col("#7FC5F0ff")},
            "header": None,
            "stack": root,
            "sticky_footer": {
                "id": uid("ftr"),
                "type": "footer",  # NOT "sticky_footer"
                "stack": build_footer(manifest),
            },
        }
    }

if __name__ == "__main__":
    rc_api.require_config()
    manifest = json.load(open(sys.argv[1] if len(sys.argv) > 1 else "/tmp/wj_assets.json"))
    rc_api.save_draft(build(manifest), {"en_US": EN, "tr": TR}, name="…")
```

### Selected package chrome

```python
stack(
    [...],
    bdr=border("#E2D3AFff", 2),  # unselected base
    overrides=selected_override({
        "border": border("#F5C24Bff", 3),
        "background_color": col("#FFFBEAff"),
    }),
)
```

Radio icon: base `icon_name="circle"`; selected override swaps to
`filled-circle-check` + color + formats.

### CTA (flat green — preferred)

Prefer a **flat** purchase button (no `cta-green` PNG). Image CTAs crop in RC
whenever box aspect ≠ asset aspect.

```python
CTA_HEIGHT = 56
cta = purchase_button(
    stack(
        [
            image(m, "crown", 20, 16),
            text("tctawj0000", 19, "bold", 700, "#FFFFFFff", "center", "fit"),
        ],
        direction="horizontal",
        align="center",
        dist="center",
        spacing=8,
        bg=GREEN,  # "#4CB944ff"
        bdr=border(GREEN_DARK, 2),  # "#2E7D26ff"
        radius=28,
        height=CTA_HEIGHT,
        padding=box(leading=16, trailing=16),
        shdw=shadow("#1E6B18aa", 5, 0, 3),
        name="CTA",
    ),
    name="Start Premium",
)
```

Only use a button PNG if the box aspect matches the asset exactly (Landing
parity: `width * 88/280`). Never `width=fill` + short height + `fit=fill`.

### Overlays

```python
# zlayer only — never negative margin (Android PaddingValues crash)
stack([back_image, front_text], direction="zlayer", align="top", width="fit")
# ribbons: normal vertical child, equal fixed height on both plan cards
```

## `publish_paywall.py`

```python
# only when user explicitly asks
rc_api.require_config()
if not rc_api.get_paywall()["components"].get("draft"):
    raise SystemExit("No draft — run build_paywall.py first")
rc_api.publish_paywall()
```

## Commands

```bash
PYTHONPATH=scripts/revenuecat-paywall python3 scripts/revenuecat-paywall/upload_assets.py <dir> /tmp/wj_assets.json
PYTHONPATH=scripts/revenuecat-paywall python3 scripts/revenuecat-paywall/build_paywall.py /tmp/wj_assets.json
PYTHONPATH=scripts/revenuecat-paywall python3 scripts/revenuecat-paywall/publish_paywall.py   # explicit ask only
```
