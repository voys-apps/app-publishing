# Roadmap — Voys Apps publishing toolkit

Target stack (our apps look like this):

| Layer | Typical choice |
| --- | --- |
| Client | Expo / React Native, `expo-router`, EN + TR (sometimes more) |
| Backend | Supabase (Auth, Postgres, Edge Functions) |
| Monetization | RevenueCat (SDK + Hosted UI + webhooks → credits / entitlements) |
| Android | Google Play + Android Publisher API, EAS local/cloud AAB |
| iOS | App Store Connect + EAS submit |
| Secrets | SA JSON / API keys in `secrets/` or 1Password — never git |
| Firebase | Management API for apps + configs; Analytics ToS / APNs may need Console |

This repo should stay **store + monetization + Firebase provision + release automation**. App feature code (chat UI, receipts, etc.) stays in each app repo.

---

## Already shipped

| Piece | Role |
| --- | --- |
| `play-launchpad` | Play listing, IAP/subs, assets, closed testing via API |
| `rc-forge` | RevenueCat catalog + Hosted UI paywalls (API/MCP + Python) |
| `firebase-launchpad` | Firebase addFirebase, Android/iOS apps, config download, Analytics handoff |
| `auth-launchpad` | Google OAuth branding/clients (Console) + Supabase Google provider (Management API) |
| `templates/play-console` | Copy-paste Node scripts for any package name |
| `templates/revenuecat` | Python list/bootstrap catalog via API v2 |
| `templates/firebase` | Node provision + config download + analytics status |

---

## Priority 1 — every new app needs this in week 1

### 1. `release-checklist` (skill)

One skill that walks: package IDs → Play SA → products → listing → assets → closed track → RC products/offerings/entitlement → paywall draft → webhook URL → EAS profile → Data Safety / privacy links.

Output: a filled markdown checklist + “blocked by Console first-launch” notes.

### 2. `eas-ship` (skill + optional template)

Conventions for all Expo apps:

- `build:android` / `build:ios` local + cloud + `release:*:cloud` with `--auto-submit`
- versionCode / buildNumber bump rules
- When to use Play API draft vs EAS submit
- Never commit `.aab` / credentials

### 3. Play **AAB upload + track promote** (extend `play-launchpad` / template)

`edits.bundles.upload` → assign to `internal` / custom closed / `production` draft. Complements EAS when AAB already exists on disk.

### 4. **App Store Connect** helpers (`asc-launchpad` skill)

Mirror Play for iOS: metadata EN/TR, screenshots sizes, IAP / subscription groups, TestFlight groups. Prefer App Store Connect API over clicking. Keep catalog files parallel to Play (`catalog.mjs` style or shared YAML).

---

## Priority 2 — monetization glue (cross-app)

### 5. `rc-catalog` → **shipped as `rc-forge` + `templates/revenuecat`**

Still to deepen:

- Virtual currency helpers
- Targeting / current offering automation
- Shared YAML catalog consumed by Play + RC templates

### 6. `rc-webhook-contract` (skill / docs)

Shared contract for Supabase `revenuecat-webhook`:

- Event types we care about (INITIAL_PURCHASE, RENEWAL, CANCELLATION, …)
- Idempotency keys
- Credit grant amounts from product metadata
- Security (auth header, raw body)

Template Deno edge function stubs — apps copy and fill product → credits map.

### 7. Unit economics + pricing sheet (docs template)

Reusable `UNIT_ECONOMICS.md` / pricing table: Pro monthly/yearly, credit packs, margin vs LLM cost. New apps fork the sheet instead of inventing prices.

---

## Priority 3 — store compliance & assets

### 8. Play **Data Safety** builder

CSV / API payload from a verified inventory questionnaire (auth providers, analytics, purchases, photos). Skill refuses to invent answers.

### 9. Privacy / Terms / Support page checklist

Voys pattern: `voysapps.io/<app>/privacy-policy` etc. Listing contactWebsite must match. Skill validates URLs in `listing-catalog.mjs`.

### 10. Store asset pipeline

- Feature graphic 1024×500 generator (from brand colors + icon)
- Phone screenshot frame templates (3–5 slots)
- Icon 512 export from Expo icon set

Can stay a skill that drives `GenerateImage` + `sips`/`sharp` resize — or a small `templates/store-assets` script.

---

## Priority 4 — ops & multi-app

### 11. Multi-app inventory

`apps.yaml` in this repo (optional, private fork or internal): package names, RC project IDs, Play Cloud projects, closed groups — so agents don’t rediscover per chat.

### 12. Closed testing / TestFlight playbook

Google Groups naming (`receezy@…` style), track naming, invite flows. Skill documents “draft app cannot complete release” and first-launch Console steps once.

### 13. Monitoring hooks (later)

RevenueCat charts / Play vitals via API — optional skill, not day-one.

---

## Explicitly out of scope (keep out of this repo)

- Product feature UI / design systems per app
- Supabase schema for domain tables (documents, receipts, …) — only billing webhook stubs
- LLM prompt engineering for app features
- Marketing website (lives in `voys-apps-website*`)

---

## Suggested folder growth

```text
skills/
  play-launchpad/          # exists
  rc-forge/                # exists — catalog + Hosted UI
  firebase-launchpad/      # exists — Firebase apps + configs
  auth-launchpad/          # exists — Google/Supabase Auth
  release-checklist/       # next
  eas-ship/                # next
  asc-launchpad/           # iOS mirror
  store-assets/            # graphics pipeline

templates/
  play-console/            # exists
  revenuecat/              # exists — list + bootstrap catalog
  firebase/                # exists — provision + download configs
  auth-supabase/           # exists — Google OAuth + Supabase provider
  revenuecat-paywall/      # optional paywall stubs
  revenuecat-webhook/      # Deno stub for Supabase
  eas/                     # eas.json profile snippets + scripts notes
  pricing/                 # UNIT_ECONOMICS + product ID conventions

docs/
  ROADMAP.md               # this file
  CODING_CONVENTIONS.md
  STACK.md                 # assumed Voys app shape
```

Ship one skill + one template at a time. Prefer extending `play-launchpad` over a third Play skill unless the trigger/description diverges clearly.
