# Agent notes — app-publishing

This repository is a **toolkit of Cursor skills + copyable templates** for shipping Voys Expo apps (Play, App Store Connect, RevenueCat, EAS).

## Before changing code

1. Read [docs/STACK.md](docs/STACK.md) — assumed app shape  
2. Follow [docs/CODING_CONVENTIONS.md](docs/CODING_CONVENTIONS.md) — skill/template style, language split, secrets  
3. Check [docs/ROADMAP.md](docs/ROADMAP.md) — prefer next priority items over random scope  

## Hard rules

- No real service-account JSON, ASC `.p8` keys, RC `sk_` keys, or `.env` in commits  
- Templates use `com.example.yourapp` placeholders only  
- Play: monetization APIs, not legacy `inappproducts` when blocked  
- Play SA JSON must be GCP project **Owner** so agents can enable APIs, IAM, and Pub/Sub/RTDN without mid-flow 403s — ask for Owner on permission denied, then use full powers  
- ASC: **apc-launchpad** (JWT → metadata, IAP, App Information forms; IPA via ASC `ipa:upload` / `buildUploads`, never `eas submit`; never Submit for Review unless asked; App Privacy practices Console)  
- Firebase: **firebase-launchpad** (Management API apps + configs; Analytics ToS / APNs Console handoff)  
- Auth: **auth-launchpad** (Google branding/clients Console handoff + Supabase Management API)  
- RC: **rc-launchpad** (catalog via MCP/`templates/revenuecat` + Hosted UI Python)  
- Play / ASC CLIs: Node ESM; invoke with **pnpm** (`pnpm install`, `pnpm <script>`) — not npm  
- Console-only steps: **agent opens URL + prints clicks; user clicks** — see firebase-launchpad [handoffs.md](skills/firebase-launchpad/handoffs.md)  
- Prefer official vendor docs over memory when writing API clients  

## Install reminder for skill bodies

```bash
npx skills add voys-apps/app-publishing -g
npx skills add voys-apps/app-publishing --skill <skill-name>
```
