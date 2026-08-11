# Examples — store-assets (Android / iOS)

## Example A — Android: “Feature graphic’i yenile”

1. Platform = **android**.  
2. `sips` current `feature-graphic.png`; reference `playstore.png`.  
3. `GenerateImage` wide banner ([generation.md](generation.md) § Android A2).  
4. `sips -z 500 1024` → `assets/play-store/feature-graphic.png`.  
5. [qa.md](qa.md) § Android.  
6. No upload unless asked.

## Example B — Android: “Play listing görsellerini baştan yap”

1. Brand intake + Android plan.  
2. Icon 512 → feature 1024×500 → 3 Play screenshots (real UI preferred).  
3. Filenames = `upload-store-assets.mjs`.  
4. Full Android QA → upload on ask.

## Example C — Android: “Play boyut red etti”

1. Re-`sips` all Play files.  
2. Feature ≠ 1024×500 → fix; icon ≠ 512 → fix; screenshots out of range → rescale.  
3. Dry-run `listing:upload-assets`.

## Example D — iOS: “App Store screenshot’ları hazırla”

1. Platform = **ios**.  
2. Ensure `appstore.png` 1024×1024 no alpha (from master, not soft 512 upscale).  
3. Capture or generate scenes → export **1290 × 2796** into `assets/app-store/screenshot-6-7-*.png`.  
4. Do **not** create a Play feature graphic for this task.  
5. [qa.md](qa.md) § iOS.  
6. Upload only on ask (ASC).

## Example E — Both: “İki store için görseller”

1. One brand lockup / icon metaphor.  
2. Export `playstore.png` (512) + `appstore.png` (1024).  
3. Android: feature + `play-store/screenshot-*`.  
4. iOS: `app-store/screenshot-6-7-*` (same stories, Apple sizes).  
5. Separate QA reports.  
6. Play upload vs ASC upload — each only when asked.

## Example F — Mistake: “Feature’ı App Store’a da koy”

1. Refuse cross-wire.  
2. Explain: 1024×500 is **Play-only**; ASC needs device screenshots (e.g. 1290×2796).  
3. Offer to produce the iOS screenshot set instead.
