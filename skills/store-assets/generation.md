# Store asset generation — Android vs iOS

Use **GenerateImage** when the user wants new or improved listing art.
Pass brand marks via `reference_image_paths` when available.

After generate → resize to the **correct platform** → [qa.md](qa.md).

---

## Brand inputs (both platforms)

| Input | Why |
| --- | --- |
| Platform(s) | android / ios / both |
| Display name | Feature graphic (Android) + screenshot captions |
| Benefit ≤ 6 words | Subline |
| Hex primary / bg | Color lock |
| Existing icon path | Consistency |
| Tone | utility / professional / warm — one |

Preserve the known app mark unless the user asks for a new logo.

---

## Anti-patterns (both)

- Purple nebula / glow soup, random 3D clay  
- Tiny illegible text  
- Star ratings, “Editor’s Choice”, fake reviews  
- Icon with tagline text  
- Unrelated stock “AI brain” art  
- Different brand colors per asset  
- **Cross-platform misuse:** Play feature (1024×500) as iOS screenshot; iOS 1024 icon with alpha / rounded corners  

---

# Android (Google Play)

## A1) Play icon → 512 × 512

**Job:** clear at ~48px notification size.

```text
App icon for "<NAME>", flat vector-like, single clear metaphor for <PRODUCT>,
centered symbol with generous padding, strong contrast, simple shapes,
no text, no tagline, square composition, brand colors <HEX> on <BG HEX>,
crisp edges suitable for Google Play / Android adaptive icon source
```

- ~15% padding from edges  
- Export: ≥1024 square → `sips -z 512 512` → `assets/images/app-icons/playstore.png`  

## A2) Feature graphic → 1024 × 500 (**Android-only asset**)

**Job:** Play browse / similar apps card — brand + one promise.  
**iOS has no equivalent slot** — do not produce this for ASC.

| Element | Allowed |
| --- | --- |
| App name | Required, largest |
| One short benefit | Optional |
| Brand mark / soft product cue | Optional |
| Stars / chips / multi-phone collage | **Forbidden** |

Layouts: left type / right art · centered brand · mark + name lockup ([SKILL](SKILL.md) era recipes).

```text
Google Play feature graphic banner, wide landscape ~2:1, full-bleed background,
app name "<NAME>" dominant, short subline "<BENEFIT>", brand colors <HEX>,
high contrast large typography, clean utility style, safe margins,
no star ratings, no fake store chrome, no multiple phone mockups, no watermarks
```

Export: ~2048×1000 → `sips -z 500 1024` → `assets/play-store/feature-graphic.png` (**exact** 1024×500).

## A3) Play phone screenshots (3–5)

Each image = **one** feature. Filenames must match `upload-store-assets.mjs`.

| # | Example file | Story |
| --- | --- | --- |
| 1 | `screenshot-document-list.png` | Home / library |
| 2 | `screenshot-create-chat.png` | Create / AI |
| 3 | `screenshot-profile.png` | Account / credits |
| 4–5 | optional | Export / paywall |

**Preferred:** real UI capture → optional frame + headline → **1080 × 1920**.  
**AI draft:** label as draft; still within Play pixel bounds.

```text
Portrait Play Store screenshot, single phone showing <SCREEN>,
brand-color background <HEX>, short headline "<HEADLINE>",
no star ratings, vertical 9:16, realistic mobile UI for <PURPOSE>
```

---

# iOS (App Store)

## I1) App Store icon → 1024 × 1024

**Job:** ASC marketing icon (also often the master for Xcode asset catalog).

```text
App icon for "<NAME>", flat vector-like, single metaphor for <PRODUCT>,
centered mark, generous padding, strong contrast, square, NO text,
NO rounded corner mask in the image, opaque background (no transparency),
brand colors <HEX>, crisp Apple App Store icon
```

Rules:

- **No alpha** — flatten onto solid brand/bg color  
- **No** pre-rounded iOS mask in the PNG  
- Same metaphor as Android icon; export from a **≥1024** master, not upscaled mushy 512  

`sips -z 1024 1024` → `assets/images/app-icons/appstore.png`

## I2) No feature graphic

Do **not** generate a 1024×500 banner for iOS listing media.  
ASC uses **screenshots** (and optional promotional art in other programs — out of scope unless user asks).

## I3) App Store screenshots (per device class)

**Job:** same stories as Android, **Apple pixel sizes**.

Default lead class: **6.7"** → **1290 × 2796**.

| Scene | Suggested file |
| --- | --- |
| Home / list | `assets/app-store/screenshot-6-7-document-list.png` |
| Create / chat | `assets/app-store/screenshot-6-7-create-chat.png` |
| Profile | `assets/app-store/screenshot-6-7-profile.png` |

If ASC also requires 6.5": duplicate scenes at **1284 × 2778** (`screenshot-6-5-*.png`).

```text
Portrait App Store screenshot for iPhone, single phone UI for <SCREEN>,
clean brand-color background <HEX>, short headline "<HEADLINE>",
no star ratings, no Play Store feature-banner look, vertical composition
suitable for 1290x2796 export
```

**Preferred:** Simulator capture at the correct logical size, then export exact pixels.  
Framed marketing shots OK if final file is exact 1290×2796 (or the required class).

---

## Both platforms in one session

1. Lock brand + icon metaphor once.  
2. Export **playstore 512** + **appstore 1024** from the same master.  
3. Android: feature + `play-store/screenshot-*`.  
4. iOS: `app-store/screenshot-6-7-*` (and other classes if needed).  
5. QA each platform separately ([qa.md](qa.md)).  

---

## Localization

1. EN first (both stores).  
2. TR: same layout, translated strings; don’t redesign.  
3. Android `tr-TR` upload only if Play script supports it; iOS localizations follow ASC locale screenshots when asked.

---

## Iteration

1–2 variants → user picks → resize + platform QA → stop unless asked again.
