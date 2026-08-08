# App Publishing

All-in-one Cursor / Claude Code / Codex skills for **shipping Voys-style mobile apps**:
Google Play Console automation + RevenueCat Hosted UI paywalls as code.

Assumes Expo + Supabase + RevenueCat + EAS (see [docs/STACK.md](docs/STACK.md)).
Grow over time: App Store Connect, release checklists, RC catalog, webhooks, store assets.

## Install

```bash
# global (all Cursor projects)
npx skills add voys-apps/app-publishing -g

# or project-scoped
npx skills add voys-apps/app-publishing
```

Install a single skill:

```bash
npx skills add voys-apps/app-publishing --skill play-launchpad
npx skills add voys-apps/app-publishing --skill rc-paywall-code
```

Badge:

[![skills.sh](https://skills.sh/b/voys-apps/app-publishing)](https://skills.sh/voys-apps/app-publishing)

## What’s inside

```text
skills/
├── play-launchpad/       # Google Play Android Publisher API
└── rc-paywall-code/      # RevenueCat Hosted UI paywalls as code

templates/
└── play-console/         # Reusable Node + googleapis scripts

docs/
├── STACK.md              # Assumed Voys app shape
├── ROADMAP.md            # What to add next (prioritized)
└── CODING_CONVENTIONS.md # How to write skills & templates
```

| Skill | Use when |
| --- | --- |
| **play-launchpad** | Play listing, IAP/subscriptions via monetization API, feature graphic / screenshots, closed testing + Google Groups, local AAB drafts |
| **rc-paywall-code** | RevenueCat Hosted UI paywalls from custom PNGs via REST API v2 (Python) |

## Play Console template

Copy into an app repo:

```bash
cp -R templates/play-console your-app/scripts/play-console
cd your-app/scripts/play-console
npm install
# put SA JSON at secrets/play-api-service-account.json (gitignored)
# edit src/catalog.mjs + src/listing-catalog.mjs for your package
npm run auth:check
```

Never commit service-account JSON. Share keys via 1Password / Bitwarden.

## Requirements

### play-launchpad

- Google Cloud project with **Google Play Android Developer API** enabled
- Service account invited in Play Console (store / releases / monetization)
- Node 18+ + `googleapis`

### rc-paywall-code

| Variable | Required | Purpose |
| --- | --- | --- |
| `RC_API_KEY` | yes* | V2 secret (`sk_...`) |
| `RC_KEY_FILE` | alt* | File containing the secret |
| `RC_PROJECT_ID` | yes | `proj...` |
| `RC_PAYWALL_ID` | yes | `pw...` |

Python 3.9+ (+ Pillow for image work). See skill docs for publish flow.

## What we’ll add next

Prioritized for apps like QuickDoc / FitCheck / Smart Receipt (Expo + RC + Supabase):

1. **release-checklist** — week-1 ship walkthrough  
2. **eas-ship** — EAS local/cloud + submit conventions  
3. Play **AAB upload / track promote**  
4. **asc-launchpad** — App Store Connect mirror  
5. **rc-catalog** + **webhook contract** stubs  
6. Data Safety / store asset generators  

Full detail: [docs/ROADMAP.md](docs/ROADMAP.md).

## Contributing / coding style

When adding skills or templates, follow [docs/CODING_CONVENTIONS.md](docs/CODING_CONVENTIONS.md)
(language split: Play → Node ESM, RC paywalls → Python, webhooks → Deno;
placeholder catalogs only; API docs before client code).

Agents: see [AGENTS.md](AGENTS.md).

## Related

Standalone RC-only repo (legacy / single-skill install):
[voys-apps/rc-paywall-code](https://github.com/voys-apps/rc-paywall-code)

## License

MIT
