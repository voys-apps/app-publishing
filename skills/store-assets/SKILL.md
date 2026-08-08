---
name: store-assets
description: >-
  Generate and resize Google Play / App Store listing graphics: app icon 512×512,
  feature graphic 1024×500, phone screenshots. Use GenerateImage + local resize
  (sips/sharp), then hand off to play-launchpad listing:upload-assets. Use when
  the user mentions store assets, feature graphic, Play screenshots, listing art,
  store-assets, or wants generated Play Console images instead of designing in
  Figma. Pair with play-launchpad for API upload.
---

# Store Assets

Produce **store-ready** images for Play (and later ASC), then upload via existing
Play scripts. This skill is **generation + sizing**; upload stays in
[`play-launchpad`](../play-launchpad/SKILL.md).

```bash
npx skills add voys-apps/app-publishing --skill store-assets
```

## When to use

| Need | Tool |
| --- | --- |
| Invent / draft icon, feature graphic, screenshot scenes | **GenerateImage** (this skill’s prompt recipes) |
| Exact pixel sizes | [sizes.md](sizes.md) + `sips` / `sharp` |
| Upload to Play | `pnpm listing:upload-assets` in `scripts/play-console` |
| Listing copy | play-launchpad `listing:upsert` — not this skill |

## Default asset layout (Voys apps)

```text
assets/
  images/app-icons/playstore.png     # 512×512 Play icon
  play-store/
    feature-graphic.png              # 1024×500
    screenshot-*.png                 # phone screenshots (see sizes.md)
```

Match whatever `scripts/play-console/src/upload-store-assets.mjs` already expects
in the app — **edit paths there** if the repo differs; don’t invent a second tree.

## Workflow

```
Task Progress:
- [ ] 1. Confirm brand: name, primary color, one-line value prop, existing icon if any
- [ ] 2. Generate candidates (icon / feature / 3–5 screenshot concepts)
- [ ] 3. Resize + export to exact store dimensions ([sizes.md](sizes.md))
- [ ] 4. Save under assets/… paths the upload script uses
- [ ] 5. Dry-run upload → real `listing:upload-assets` only when user asks
- [ ] 6. Spot-check in Play Console listing preview
```

## Generation principles

Full prompt recipes: [generation.md](generation.md).

1. **One job per asset** — feature graphic ≠ screenshot collage ≠ icon.  
2. **Readable at small size** — icon: simple mark + strong contrast; no tiny text.  
3. **Feature graphic** — brand/product name large; short supporting line optional; no fake UI chrome clutter; safe margins from edges.  
4. **Screenshots** — show real product UI or honest mock frames; prefer 3–5 phone shots with a single headline each (text can be burned in or added in a frame pass).  
5. **No store policy bait** — no misleading “#1”, fake ratings, or competitor marks.  
6. **Localize later** — generate EN first; TR/other as a second pass with same layout.

## Resize (macOS)

```bash
# Feature graphic
sips -z 500 1024 source.png --out assets/play-store/feature-graphic.png

# Play icon
sips -z 512 512 source.png --out assets/images/app-icons/playstore.png
```

Prefer generating **at or above** target resolution, then downscale. Avoid
upscaling blurry AI output.

## Upload

```bash
cd scripts/play-console
pnpm listing:upload-assets -- --dry-run
pnpm listing:upload-assets   # only when user wants Console updated
```

## Hard rules

1. Never upload without an explicit ask (generate + save locally is fine).  
2. Exact pixels from [sizes.md](sizes.md) — Play rejects wrong feature graphic size.  
3. Do not put secrets or real SA JSON into asset prompts.  
4. If the app already has good art, **iterate** — don’t regenerate from scratch unless asked.  
5. ASC sizes differ — when doing iOS, follow [sizes.md](sizes.md) § App Store (don’t force Play 1024×500 into ASC).

## Additional resources

- [sizes.md](sizes.md) — Play + ASC dimensions  
- [generation.md](generation.md) — prompt patterns + composition  
- play-launchpad upload / listing scripts  
