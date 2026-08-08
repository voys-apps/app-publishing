# App Publishing

All-in-one Cursor / Claude Code / Codex skills for **shipping Voys-style mobile apps**:
Google Play Console automation + RevenueCat forge (catalog + Hosted UI).

Assumes Expo + Supabase + RevenueCat + EAS (see [docs/STACK.md](docs/STACK.md)).

## Install

```bash
# global (all Cursor projects)
npx skills add voys-apps/app-publishing -g

# or project-scoped (recommended per app repo)
npx skills add voys-apps/app-publishing --all
```

Single skills:

```bash
npx skills add voys-apps/app-publishing --skill play-launchpad
npx skills add voys-apps/app-publishing --skill rc-launchpad
```

Badge:

[![skills.sh](https://skills.sh/b/voys-apps/app-publishing)](https://skills.sh/voys-apps/app-publishing)

## What’s inside

```text
skills/
├── play-launchpad/       # Google Play Android Publisher API
└── rc-launchpad/             # RevenueCat catalog + Hosted UI paywalls

templates/
├── play-console/         # Node + googleapis
└── revenuecat/           # Python catalog list + bootstrap

docs/
├── STACK.md
├── ROADMAP.md
└── CODING_CONVENTIONS.md
```

| Skill | Use when |
| --- | --- |
| **play-launchpad** | Play listing, IAP/subs, assets, closed testing |
| **rc-launchpad** | RC products/offerings/entitlements + custom PNG Hosted UI → publish on ask |

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

Never commit service-account JSON or RC `sk_` keys.

## Requirements

### play-launchpad

- Google Play Android Developer API + SA invited in Play Console
- Node 18+ + `googleapis`

### rc-launchpad

| Variable | Required | Purpose |
| --- | --- | --- |
| `RC_API_KEY` | yes* | V2 secret (`sk_...`) |
| `RC_KEY_FILE` | alt* | File containing the secret |
| `RC_PROJECT_ID` | yes | `proj...` |
| `RC_PAYWALL_ID` | paywall | `pw...` |

Python 3.9+ (+ Pillow for paywall image work).

## What we’ll add next

See [docs/ROADMAP.md](docs/ROADMAP.md): release-checklist, eas-ship, ASC, webhook contract, assets.

## Contributing

[docs/CODING_CONVENTIONS.md](docs/CODING_CONVENTIONS.md) · [AGENTS.md](AGENTS.md)

## Related

Legacy RC paywall-only: [voys-apps/rc-paywall-code](https://github.com/voys-apps/rc-paywall-code)

## License

MIT
