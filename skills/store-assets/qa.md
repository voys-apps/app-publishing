# Store assets QA — Android vs iOS

Do **not** say assets are ready until the **requested platform** checklist passes.

Ask/confirm: `android` | `ios` | `both`.

---

## Android (Google Play)

### 1) Files

- [ ] `assets/images/app-icons/playstore.png`  
- [ ] `assets/play-store/feature-graphic.png`  
- [ ] ≥2 `assets/play-store/screenshot-*.png` (names match upload script)  

### 2) Dimensions

```bash
sips -g pixelWidth -g pixelHeight assets/images/app-icons/playstore.png
sips -g pixelWidth -g pixelHeight assets/play-store/feature-graphic.png
for f in assets/play-store/screenshot-*.png; do
  echo "== $f"; sips -g pixelWidth -g pixelHeight "$f"
done
```

| File | Must be |
| --- | --- |
| playstore.png | **512 × 512** |
| feature-graphic.png | **1024 × 500** |
| screenshot-*.png | sides 320–3840; prefer **1080 × 1920** |

### 3) Visual

- [ ] Feature: name readable ~30% zoom; full-bleed; no stars/badges  
- [ ] Icon: clear small; no tagline  
- [ ] Screenshots: one story each; brand-aligned  

### 4) Report

```text
Android store assets QA
- playstore.png: 512×512 …
- feature-graphic.png: 1024×500 …
- screenshots: N files …
Upload: waiting (play-launchpad)
```

### 5) Upload gate (user ask)

```bash
pnpm --dir scripts/play-console listing:upload-assets -- --dry-run
pnpm --dir scripts/play-console listing:upload-assets
```

---

## iOS (App Store)

### 1) Files

- [ ] `assets/images/app-icons/appstore.png`  
- [ ] ≥2 screenshots for required size class, e.g. `assets/app-store/screenshot-6-7-*.png`  
- [ ] Extra classes (6.5", iPad) only if user/ASC requires  

### 2) Dimensions

```bash
sips -g pixelWidth -g pixelHeight assets/images/app-icons/appstore.png
# expect 1024 × 1024
for f in assets/app-store/screenshot-6-7-*.png; do
  echo "== $f"; sips -g pixelWidth -g pixelHeight "$f"
  # expect 1290 × 2796
done
```

| File | Must be |
| --- | --- |
| appstore.png | **1024 × 1024**, no alpha |
| screenshot-6-7-* | **1290 × 2796** |
| screenshot-6-5-* | **1284 × 2778** (if present) |

### 3) Visual / policy

- [ ] Icon: no rounded mask, no transparency  
- [ ] No Play feature graphic used as a screenshot  
- [ ] Screenshots: one story each; readable captions  
- [ ] No fake ratings / competitor marks  

### 4) Report

```text
iOS store assets QA
- appstore.png: 1024×1024 …
- 6.7" screenshots: N files @ 1290×2796 …
Upload: waiting (ASC / asc-launchpad)
```

### 5) Upload gate

Deliver paths to the user; upload only when they ask (ASC Connect / Transporter / future `asc-launchpad`).

---

## Both

Run **Android** and **iOS** sections independently. Passing one does not pass the other.
