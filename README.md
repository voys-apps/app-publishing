# App Publishing

All-in-one Cursor / Claude Code / Codex skills for **shipping mobile apps**:
Google Play Console automation + RevenueCat Hosted UI paywalls as code.

Grow this repo over time (App Store Connect, Data Safety helpers, AAB upload
pipelines, store asset generators, …).

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
│   ├── SKILL.md
│   ├── api-constraints.md
│   ├── scaffold.md
│   └── examples.md
└── rc-paywall-code/      # RevenueCat Hosted UI paywalls as code
    ├── SKILL.md
    ├── python-patterns.md
    └── api-constraints.md

templates/
└── play-console/         # Reusable Node + googleapis scripts (copy into app repos)
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

## Roadmap (future skills / templates)

- [ ] App Store Connect listing + IAP helpers
- [ ] Play Data Safety CSV builder (from verified app inventory)
- [ ] AAB upload + track promote CLI
- [ ] Store screenshot / feature-graphic generators
- [ ] Unified “release checklist” skill across stores

## Related

Standalone RC-only repo (legacy / single-skill install):
[voys-apps/rc-paywall-code](https://github.com/voys-apps/rc-paywall-code)

## License

MIT
