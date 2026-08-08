# Store asset generation recipes

Use Cursor **GenerateImage** (or equivalent) only when the user wants new art.
Then resize to [sizes.md](sizes.md).

## Brand inputs (ask if missing)

- App display name  
- One sentence: what it does  
- Primary + background colors (hex)  
- Existing icon / logo path (prefer refining over replacing)  
- Tone: utility / playful / professional (pick one)

## Icon (512 → Play)

**Goal:** recognizable mark at ~48px notification size.

Prompt pattern:

- Flat or soft-gradient vector-like app icon  
- Single metaphor (doc, scan, spark) — not a busy scene  
- Centered mark, generous padding, no tagline text  
- Avoid purple-glow / generic AI chrome clichés unless brand already uses them  

After generate: `sips -z 512 512` → `assets/images/app-icons/playstore.png`.

## Feature graphic (1024 × 500)

**Goal:** store browse card — brand first, one promise.

Composition budget:

- App name (large)  
- One short line of benefit  
- Optional small product UI or icon cluster on one side  
- Full-bleed background (gradient or soft photo) — **not** a tiny centered card  

Prompt pattern:

- Wide 2:1 banner, safe margins ~48px from edges  
- High contrast text  
- No star ratings, no “#1 app”, no store UI chrome  
- Match brand colors  

Generate oversized (e.g. 2048 × 1000) then `sips -z 500 1024`.

## Phone screenshots (3–5)

Each shot = **one** feature.

| Slot | Example scene (QuickDoc-like) |
| --- | --- |
| 1 | Home / doc list |
| 2 | Create / chat |
| 3 | Result / export |
| 4 | Paywall or credits (optional) |
| 5 | Profile / settings (optional) |

Two approaches:

1. **Device frame + real screenshot** — capture from simulator, drop into a simple frame template (preferred when app UI exists).  
2. **Full AI scene** — only if UI isn’t ready; label as concept; replace before production listing.

Caption: short headline above or below the phone — not a paragraph.

## Iteration

1. Generate 1–2 variants per asset  
2. User picks  
3. Resize + save to canonical paths  
4. Upload only on ask  

## Pairing

- Upload / API: play-launchpad  
- Closed testing recruit art: optional later; not required for MVP listing  
