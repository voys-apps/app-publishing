# Store image sizes

## Google Play (required for listing assets skill)

| Asset | Size (px) | Format notes |
| --- | --- | --- |
| Hi-res icon | **512 × 512** | 32-bit PNG; no alpha required but OK if Play accepts |
| Feature graphic | **1024 × 500** | PNG or JPEG; **exact** size |
| Phone screenshots | **min 320**, **max 3840** on any side | 16:9 or 9:16 common; 2–8 images typical |
| 7-inch tablet screenshots | optional | Separate imageType in Publisher API |
| 10-inch tablet screenshots | optional | Separate imageType |

Voys default phone screenshot working size (generate then crop/letterbox if needed):

| Orientation | Suggested export |
| --- | --- |
| Portrait | **1080 × 1920** or **1242 × 2688** |
| Landscape | **1920 × 1080** |

Always verify against current Play docs if upload fails on dimension.

## App Store Connect (later / asc-launchpad)

| Asset | Common sizes |
| --- | --- |
| App icon | 1024 × 1024 (no alpha, no rounded mask in file) |
| 6.7" screenshots | 1290 × 2796 (portrait) |
| 6.5" screenshots | 1284 × 2778 |
| 5.5" screenshots | 1242 × 2208 |

Do **not** reuse Play feature graphic (1024×500) as an ASC screenshot.

## Filename conventions (Voys)

```text
assets/images/app-icons/playstore.png
assets/play-store/feature-graphic.png
assets/play-store/screenshot-<scene>.png
```

Keep EN assets as the primary set; add `*-tr.png` only if the upload script is extended for `tr-TR`.
