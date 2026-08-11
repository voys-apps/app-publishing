---
name: store-assets
description: >-
  HIGH PRIORITY skill for Google Play (Android) and App Store (iOS) listing
  graphics. Generate, critique, resize, and QA store art per platform: Android
  icon 512×512 + feature graphic EXACT 1024×500 + Play screenshots; iOS icon
  1024×1024 (no alpha) + device-class screenshots. Use whenever the user
  mentions store assets, feature graphic, Play/App Store screenshots, listing
  images, store icon, Play Console / App Store Connect graphics, store-assets,
  or wants better listing art. Prefer GenerateImage + reference icons. Always
  verify pixels with sips. Ask which platform(s) if unclear. Upload Play via
  play-launchpad only when asked; ASC upload waits for asc-launchpad / user.
  Treat listing visuals as launch-blocking.
---

# Store Assets (priority skill)

Listing art is **first-class release work**. Sizes and rules differ by
**platform** — never reuse a Play feature graphic as an App Store screenshot.

**Owns:** invent → resize → save → **dimension QA** (Android and/or iOS).  
**Does not own:** Play API upload ([`play-launchpad`](../play-launchpad/SKILL.md)); ASC API upload (`asc-launchpad` when it exists).

```bash
npx skills add voys-apps/app-publishing --skill store-assets
```

## Platform first

| User says… | Target |
| --- | --- |
| Play / Android / feature graphic / `listing:upload-assets` | **Android** — [sizes.md](sizes.md) § Android, [generation.md](generation.md) § Android |
| App Store / iOS / TestFlight / ASC screenshots | **iOS** — [sizes.md](sizes.md) § iOS, [generation.md](generation.md) § iOS |
| “store assets” / “listing görselleri” (ambiguous) | Ask: **Android, iOS, or both?** Default Voys week-1 = **Android first** |

Do **both** only when asked (or “her iki store”). Shared brand mark can be one design system; **export files are platform-specific**.

## Read before generating

1. [sizes.md](sizes.md) — Android vs iOS pixels + verify  
2. [generation.md](generation.md) — platform prompts + anti-patterns  
3. [qa.md](qa.md) — platform checklists  
4. [examples.md](examples.md) — flows  

## When to use which tool

| Need | Tool |
| --- | --- |
| New icon / feature / screenshot concepts | **GenerateImage** (+ `reference_image_paths`) |
| Exact pixels | `sips` / `sharp` — [sizes.md](sizes.md) |
| Prove sizes | `sips -g pixelWidth -g pixelHeight` — **required** |
| Upload Android | `pnpm listing:upload-assets` (user ask only) |
| Upload iOS | ASC / Transporter / `asc-launchpad` when available — user ask only |
| Listing copy | play-launchpad / ASC metadata — not this skill |

## Canonical paths (Voys)

```text
assets/
  images/app-icons/
    playstore.png              # Android 512×512
    appstore.png               # iOS 1024×1024
  play-store/                  # Android (Play Console)
    feature-graphic.png        # 1024×500 EXACT
    screenshot-<scene>.png
  app-store/                   # iOS (create if missing)
    screenshot-6-7-<scene>.png # e.g. 1290×2796
    screenshot-6-5-<scene>.png # optional second size class
```

Match `scripts/play-console/src/upload-store-assets.mjs` for Android filenames.
For iOS, keep a clear `assets/app-store/` tree until ASC upload scripts exist.

## Agent workflow

```
Task Progress:
- [ ] 0. Platform — android | ios | both (ask if unclear)
- [ ] 1. Brand intake — name, hex, benefit, existing icon
- [ ] 2. Inventory — sips on current platform files
- [ ] 3. Plan set — which assets for that store
- [ ] 4. Generate 1–2 variants (reference icon)
- [ ] 5. Resize to platform targets; save canonical paths
- [ ] 6. QA — [qa.md](qa.md) for that platform
- [ ] 7. Show paths + dimensions; iterate on ask
- [ ] 8. Upload only on explicit ask (Play vs ASC handoff)
```

### Brand intake

- Display name (feature graphic / screenshot captions)  
- Benefit ≤ ~6 words  
- Primary / accent / background hex  
- Existing mark path  
- Tone: utility | professional | warm  
- **Platform(s)**  

## Non‑negotiables

### Android (Google Play)

1. Feature graphic **exactly 1024 × 500**.  
2. Hi-res icon **512 × 512**.  
3. Phone screenshots within Play min/max (prefer 1080 × 1920).  

### iOS (App Store)

1. Marketing icon **1024 × 1024**, **no alpha**, no baked rounded corners.  
2. Screenshots match a **required device size class** (e.g. 6.7" 1290 × 2796).  
3. **No** Play feature graphic (1024×500) in ASC screenshot slots.  

### Shared

4. Never claim ready without printing `sips` sizes.  
5. Never upload without explicit ask.  
6. No fake ratings / “#1” / competitor marks.  
7. One job per file; prefer real UI screenshots when the app exists.  

## Resize (macOS) — note `sips -z` is **height width**

```bash
# Android feature
sips -z 500 1024 ./src.png --out ./assets/play-store/feature-graphic.png
# Android icon
sips -z 512 512 ./src.png --out ./assets/images/app-icons/playstore.png
# iOS icon
sips -z 1024 1024 ./src.png --out ./assets/images/app-icons/appstore.png
# iOS 6.7" screenshot example
sips -z 2796 1290 ./src.png --out ./assets/app-store/screenshot-6-7-home.png
```

## Upload handoff

**Android**

```bash
cd scripts/play-console
pnpm listing:upload-assets -- --dry-run
pnpm listing:upload-assets   # user ask only
```

**iOS** — deliver files under `assets/app-store/` + icon; upload via ASC tooling / future `asc-launchpad` only when the user asks.

## Hard rules

1. Platform-specific exports — do not cross-wire Play ↔ ASC assets.  
2. Exact pixels from [sizes.md](sizes.md).  
3. No secrets in prompts.  
4. EN first; localize on ask.  

## Additional resources

- [sizes.md](sizes.md) · [generation.md](generation.md) · [qa.md](qa.md) · [examples.md](examples.md)  
