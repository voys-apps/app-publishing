# RevenueCat paywall API constraints

These return 400/422 with little detail. Validate before PATCH.

Android Hosted UI (`react-native-purchases-ui` 9.x / purchases-android 9.19)
also **crashes the app at render** for two layout mistakes that the REST API
happily accepts. Validate those before every PATCH — see **Android SDK
crashes** below.

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
- `badge.style` only accepts `"nested"`. For ribbons, put the chip as a normal
  **vertical child** (or a `zlayer` overlay) — **never** negative margin.

## Android SDK crashes (must not ship)

`edits.insert` / paywall PATCH will succeed. The **Android** paywall then dies
on open. iOS often looks fine. Always walk the tree for these before publish.

### 1. Negative padding / margin → `Top padding must be non-negative`

```
java.lang.IllegalArgumentException: Top padding must be non-negative
  at PaddingValuesImpl.<init>
  at PaddingKt.toPaddingValues
  at StyleFactory.createImageComponentStyle   // or createStackComponentStyle
```

purchases-android **9.19.x** maps **every** component’s `padding` **and**
`margin` through Compose `PaddingValues` with **no clamp**. Negatives crash.

This includes **images and stacks**. Moving `margin.top: -20` from an image onto
a wrapping stack still crashes (`createStackComponentStyle` — children are
built first, then the parent’s `toPaddingValues`).

**Do:** keep every `padding` / `margin` side `>= 0`. Overlap with `zlayer` +
`alignment: "top"`, or put a ribbon as a regular child and give both plan cards
the same fixed height.

**Do not:** `margin=box(top=-22)` on plaques, ribbons, or offer blocks.

DSL: `image()` and `stack()` must raise if any box side is negative.

### 2. Nested vertical scroll → infinity height

```
java.lang.IllegalStateException: Vertically scrollable component was measured
with an infinity maximum height constraints, which is disallowed.
  at checkScrollableContainerConstraints
  at ScrollingLayoutNode.measure
  at FillNode.measure
```

On 9.19.x, `LoadedPaywallComponents` **always** wraps the root stack in
`Modifier.weight(1f).verticalScroll(...)`.

If the root **also** has `overflow: "scroll"` and/or `height: "fill"`, Compose
sees nested vertical scroll + fill inside unbounded constraints and crashes.
(Fixed upstream in purchases-android **#3404** / 10.3.1+ — most Expo apps on
`react-native-purchases` 9.7.x still ship 9.19.x.)

**Do** (9.x Android):

```python
root = stack([...], height="fit", name="Content")  # no scroll=, no height="fill"
# sticky_footer still holds the CTA
```

**Do not:** root `height="fill"` + `scroll="scroll"` (or either one alone on 9.x
when the wrapper already scrolls). Let RC own the outer scroll. Sticky footer
still sticks.

After a paywall PATCH, testers must **force-quit** the app so the SDK refetches.

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
layouts need a `sticky_footer` (RC’s outer scroll handles the body on Android
9.x). Do **not** add root `overflow: "scroll"` on 9.x — see Android SDK crashes.

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
