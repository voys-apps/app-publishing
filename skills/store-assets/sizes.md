# Store image sizes — Android vs iOS

Always confirm **platform** before exporting. Limits change rarely; re-check if upload fails.

---

## Android — Google Play

| Asset | Size (px) | Publisher API `imageType` | Notes |
| --- | --- | --- | --- |
| Hi-res icon | **512 × 512** | `icon` | Square PNG; ~10–15% safe pad for mark |
| Feature graphic | **1024 × 500** | `featureGraphic` | **Exact** — not 1024×512, not 1000×500 |
| Phone screenshots | each side **320–3840** | `phoneScreenshots` | 2–8 images; portrait preferred |
| 7" tablet | optional | `sevenInchScreenshots` | Only if user asks |
| 10" tablet | optional | `tenInchScreenshots` | Only if user asks |

### Android working exports (Voys)

| Role | Export | Aspect |
| --- | --- | --- |
| Feature graphic | **1024 × 500** | ≈ 2.048:1 |
| Play icon | **512 × 512** | 1:1 |
| Phone screenshot (preferred) | **1080 × 1920** | 9:16 |
| Phone screenshot (alt) | **1242 × 2688** | ~9:19.5 |
| Phone screenshot (legacy OK) | **470 × 1024** | valid if within min/max |

Prefer **1080 × 1920** for new Android screenshot sets.

### Android feature graphic safe area

```text
┌──────────────────────────────────────── 1024
│  ~48px margin                             │
│    ┌──────────────────────────────┐       │ 500
│    │  brand + short line + art    │       │
│    └──────────────────────────────┘       │
│  ~48px margin                             │
└───────────────────────────────────────────┘
```

### Android paths

```text
assets/images/app-icons/playstore.png
assets/play-store/feature-graphic.png
assets/play-store/screenshot-<scene>.png
```

### Android verify

```bash
sips -g pixelWidth -g pixelHeight assets/images/app-icons/playstore.png
# expect 512 × 512
sips -g pixelWidth -g pixelHeight assets/play-store/feature-graphic.png
# expect 1024 × 500
for f in assets/play-store/screenshot-*.png; do
  echo "== $f"; sips -g pixelWidth -g pixelHeight "$f"
done
```

Gate script (Android required pair):

```bash
python3 - <<'PY'
from pathlib import Path
import subprocess, sys
checks = [
  ("assets/images/app-icons/playstore.png", 512, 512),
  ("assets/play-store/feature-graphic.png", 1024, 500),
]
bad = False
for path, w, h in checks:
    p = Path(path)
    if not p.exists():
        print(f"MISSING {path}"); bad = True; continue
    out = subprocess.check_output(["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(p)], text=True)
    cw = int([l.split(":")[1] for l in out.splitlines() if "pixelWidth" in l][0])
    ch = int([l.split(":")[1] for l in out.splitlines() if "pixelHeight" in l][0])
    ok = cw == w and ch == h
    print(f"{'OK' if ok else 'BAD'} {path} got {cw}x{ch} want {w}x{h}")
    bad |= not ok
sys.exit(1 if bad else 0)
PY
```

---

## iOS — App Store Connect

Apple requires screenshots for **specific display sizes**. Pick the size classes the app’s ASC listing needs (commonly **6.7"** as the lead).

| Asset | Size (px) | Notes |
| --- | --- | --- |
| App icon (ASC marketing) | **1024 × 1024** | **No alpha**; no rounded mask baked into the file |
| iPhone 6.7" screenshots | **1290 × 2796** | Portrait lead size for modern phones |
| iPhone 6.5" screenshots | **1284 × 2778** | Often required if targeting that class |
| iPhone 5.5" screenshots | **1242 × 2208** | Older; only if ASC still requires for the app |
| iPad Pro 12.9" (6th) | **2048 × 2732** | Only if iPad is supported / required |

Confirm against current ASC “View All Sizes in Media Manager” if a size is rejected.

### iOS vs Android — do not mix

| Don’t | Why |
| --- | --- |
| Use Play **1024 × 500** feature as ASC screenshot | Wrong aspect + wrong slot |
| Use Play **512** icon as ASC **1024** without upscale from master | Soft / blurry |
| Bake iOS rounded corners into `appstore.png` | Apple applies mask |
| Ship alpha channel on ASC icon | Rejected |

### iOS paths (Voys convention)

```text
assets/images/app-icons/appstore.png
assets/app-store/
  screenshot-6-7-document-list.png   # 1290×2796
  screenshot-6-7-create-chat.png
  screenshot-6-7-profile.png
  # optional:
  screenshot-6-5-*.png               # 1284×2778
```

Same **scenes** as Android screenshots; different **pixel targets** and folder.

### iOS verify

```bash
sips -g pixelWidth -g pixelHeight assets/images/app-icons/appstore.png
# expect 1024 × 1024
for f in assets/app-store/screenshot-6-7-*.png; do
  echo "== $f"; sips -g pixelWidth -g pixelHeight "$f"
  # expect 1290 × 2796
done
```

---

## Shared brand master (optional)

Keep a high-res square master (e.g. `icon-source.png` ≥ 1024) and derive:

- Android → 512 (`playstore.png`)  
- iOS → 1024 (`appstore.png`)  

Never derive iOS 1024 by upscaling a soft 512-only file if a larger master exists.
