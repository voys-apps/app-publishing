# Agent notes — app-publishing

This repository is a **toolkit of Cursor skills + copyable templates** for shipping Voys Expo apps (Play, App Store later, RevenueCat, EAS).

## Before changing code

1. Read [docs/STACK.md](docs/STACK.md) — assumed app shape  
2. Follow [docs/CODING_CONVENTIONS.md](docs/CODING_CONVENTIONS.md) — skill/template style, language split, secrets  
3. Check [docs/ROADMAP.md](docs/ROADMAP.md) — prefer next priority items over random scope  

## Hard rules

- No real service-account JSON, RC `sk_` keys, or `.env` in commits  
- Templates use `com.example.yourapp` placeholders only  
- Play: monetization APIs, not legacy `inappproducts` when blocked  
- RC catalog: **rc-api** (MCP or `templates/revenuecat`); paywalls: **rc-paywall-code** (Python)  
- Play CLIs: Node ESM  
- Prefer official vendor docs over memory when writing API clients  

## Install reminder for skill bodies

```bash
npx skills add voys-apps/app-publishing -g
npx skills add voys-apps/app-publishing --skill <skill-name>
```
