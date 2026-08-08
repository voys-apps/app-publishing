# App Publishing

All-in-one Cursor skills for **shipping Voys-style mobile apps**:
Play Console, RevenueCat (catalog + paywalls + credits bridge), Firebase, Auth,
AdMob, and store asset generation.

Assumes Expo + Supabase + RevenueCat + EAS (see [docs/STACK.md](docs/STACK.md)).

## Install

```bash
# global (all Cursor projects)
npx skills add voys-apps/app-publishing -g

# or project-scoped (recommended per app repo)
npx skills add voys-apps/app-publishing --agent cursor -y
```

Single skills:

```bash
npx skills add voys-apps/app-publishing --skill play-launchpad
npx skills add voys-apps/app-publishing --skill rc-launchpad
npx skills add voys-apps/app-publishing --skill store-assets
```

Badge:

[![skills.sh](https://skills.sh/b/voys-apps/app-publishing)](https://skills.sh/voys-apps/app-publishing)

## What’s inside

```text
skills/
├── play-launchpad/       # Play API + local Android CI
├── rc-launchpad/         # Catalog + Hosted UI + credits-bridge (RTDN/webhook)
├── store-assets/         # Icon / feature graphic / screenshot generation
├── firebase-launchpad/
├── auth-launchpad/
└── admob-launchpad/

templates/
├── play-console/
├── revenuecat/
├── revenuecat-webhook/   # Deno stub
├── expo/easignore.example
├── firebase/
└── auth-supabase/
```

| Skill | Use when |
| --- | --- |
| **play-launchpad** | Play listing, IAP/subs, closed testing, local AAB upload |
| **rc-launchpad** | RC catalog + paywalls + RTDN/Supabase credits webhook |
| **store-assets** | Generate/resize 512 icon, 1024×500 feature, screenshots |
| **firebase-launchpad** | Firebase apps, configs, FCM → EAS |
| **auth-launchpad** | Google Sign-In Console + Supabase provider |
| **admob-launchpad** | Console handoff → `ca-app-pub` → EAS env |

## Templates

### Play Console

```bash
cp -R templates/play-console your-app/scripts/play-console
```

### RevenueCat catalog

```bash
cp -R templates/revenuecat your-app/scripts/revenuecat
export RC_API_KEY=sk_... RC_PROJECT_ID=proj...
python3 scripts/revenuecat/list_catalog.py
python3 scripts/revenuecat/bootstrap_catalog.py --dry-run
```

### RevenueCat → Supabase webhook stub

```bash
cp -R templates/revenuecat-webhook your-app/supabase/functions/revenuecat-webhook
# see skills/rc-launchpad/credits-bridge.md
```

Never commit service-account JSON or RC `sk_` keys.

## Requirements

### play-launchpad

- Google Play Android Developer API + SA invited in Play Console (prefer GCP **Owner**)
- Node 18+ + `googleapis`
- Local builds: `pnpm build:android` — never cloud unless asked; `.easignore` must not ignore `.env*`

### rc-launchpad

| Variable | Required | Purpose |
| --- | --- | --- |
| `RC_API_KEY` | yes* | V2 secret (`sk_...`) |
| `RC_KEY_FILE` | alt* | File containing the secret |
| `RC_PROJECT_ID` | yes | `proj...` |
| `RC_PAYWALL_ID` | paywall | `pw...` |
| `REVENUECAT_WEBHOOK_SECRET` | webhook | Edge Function auth |

Python 3.9+ (+ Pillow for paywall image work).

## What’s next (TODO)

See [docs/ROADMAP.md](docs/ROADMAP.md): `eas-ship`, `asc-launchpad`, `release-checklist`, Data Safety, privacy URLs.

## License

MIT — see [LICENSE](LICENSE).
