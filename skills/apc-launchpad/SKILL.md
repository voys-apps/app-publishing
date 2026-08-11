---
name: apc-launchpad
description: >-
  Automate App Store Connect via ASC API: API-key JWT auth, bundle ID create,
  subscription groups + auto-renewable subs + consumable IAPs (v2), What's New /
  promotional text / description / keywords upsert, review notes, and app
  resolve by bundle ID. Use when the user mentions App Store Connect, ASC,
  What's New, promotional text, iOS store metadata, IAP, subscriptions,
  Transporter after-upload listing, release notes upload, or apc-launchpad.
  Works in any iOS / Expo repo. Pair with play-launchpad (Android),
  rc-launchpad (SKU sync), and store-assets (screenshots).
---

# APC Launchpad

Ship and maintain **any** App Store Connect listing through the **App Store
Connect API**. Prefer API scripts over Transporter UI paste / Playwright for
version metadata, review notes, and IAP scaffolding.

**Install** (from the all-in-one publishing toolkit):

```bash
npx skills add voys-apps/app-publishing --skill apc-launchpad
# or entire toolkit:
npx skills add voys-apps/app-publishing -g
```

Reusable Node scripts live in this repo at `templates/app-store-connect/` —
copy into app repos as `scripts/app-store-connect/`.

Use this skill in **any** project. If the repo already has
`scripts/app-store-connect/` (or similar), prefer those. Otherwise scaffold
from the template or [scaffold.md](scaffold.md). Do not invent endpoints —
confirm against live Apple docs when writing or changing client code.

## When to use which tool

| Need | Tool |
| --- | --- |
| Auth / list apps | ASC API + `pnpm auth:check` |
| Resolve numeric Apple ID from bundle | `pnpm app:resolve` → set `ASC_APP_APPLE_ID` |
| Register bundle ID | `POST /v1/bundleIds` (IOS / MAC_OS / UNIVERSAL) |
| **Create ASC app record** | **Console only** — `POST /v1/apps` returns 403 CREATE forbidden |
| Subscription group + auto-renewable | `POST /v1/subscriptionGroups` + `POST /v1/subscriptions` + localizations |
| Consumable IAP | `POST /v2/inAppPurchases` (not `/v1/inAppPurchases`) + localizations |
| Pricing / Ready to Submit | **Console handoff** (price points) |
| What’s New / promotional / description / keywords | `pnpm metadata:upsert` |
| App Review notes | same upsert via `REVIEW` (needs `contactPhone` `+CC …`) |
| IPA / TestFlight binary upload | **Not in scripts** — `eas submit` / Transporter |
| Screenshots / previews | ASC Console or later template; generation via **store-assets** |
| Play Store (Android) | **play-launchpad** |

**Do not** use Playwright to fill ASC forms when the API covers the task.

## Multi-team keys (Voys)

ASC API keys are **per Apple Developer team / provider**, not per Gmail user.

| Example | Team | Apps visible |
| --- | --- | --- |
| Receezy / Smart Receipt key | e.g. Voys Apps (older Issuer) | Receezy, Sokak Lambası, Smart Receipt |
| Aliye `skill-key` | e.g. `TMX779UK9D` | Words Journey, Varlık360 (`com.appsvoys.varlik360`), Slide AI, QuickDoc |

If `auth:check` is missing an app you expect (e.g. Stock360/Varlık360), you are on the **wrong Issuer/Key** — switch `.env` to the team that owns the app. Account Holder UI login ≠ which team the `.p8` belongs to.

## Consult official API docs

**Required before generating or changing API client code:**

1. Fetch / open official docs — do not invent paths or payloads:
   - Overview: https://developer.apple.com/documentation/appstoreconnectapi
   - Creating API keys: https://developer.apple.com/documentation/appstoreconnectapi/creating_api_keys_for_app_store_connect_api
   - Apps: https://developer.apple.com/documentation/appstoreconnectapi/list_apps
   - App Store versions: https://developer.apple.com/documentation/appstoreconnectapi/list_all_app_store_versions_for_an_app
   - Version localizations: https://developer.apple.com/documentation/appstoreconnectapi/app_store_version_localizations
   - Modify localization: https://developer.apple.com/documentation/appstoreconnectapi/modify_an_app_store_version_localization
   - Review detail: https://developer.apple.com/documentation/appstoreconnectapi/app_store_review_details
2. Confirm HTTP method, path, JWT (`iss` / `kid` / `aud: appstoreconnect-v1`), and field names.
3. Apply recipes in [api-constraints.md](api-constraints.md) and [scaffold.md](scaffold.md).

If docs and this skill disagree, **prefer live Apple docs**, then update the
skill notes.

Use `WebFetch` / `WebSearch` in the same turn you scaffold or edit API code.

## Workflow

```
Task Progress:
- [ ] 1. Locate ASC API key (.p8) + Issuer ID + Key ID for the **correct team**
- [ ] 2. Set ASC_BUNDLE_ID (+ ASC_TEAM_ID); scaffold scripts/app-store-connect
- [ ] 3. pnpm auth:check — confirm expected apps appear
- [ ] 4. If app missing: POST bundleIds if needed → **Console New App** → app:resolve → ASC_APP_APPLE_ID
- [ ] 5. IAP: subscriptionGroups + subscriptions; consumables via POST /v2/inAppPurchases; EN/TR locs
- [ ] 6. Console: pricing + Ready to Submit; Paid Apps agreement
- [ ] 7. Fill metadata-catalog.mjs; upsert (omit whatsNew on first version if STATE_ERROR)
- [ ] 8. RC: create-app app_store + attach SKUs (rc-launchpad); paste ASC credentials in RC dashboard
- [ ] 9. Binary: eas submit / Transporter
```

## IAP / subscriptions (API + handoff)

Reverse-DNS IDs shared with Play when possible (`com.<co>.<app>.pro.monthly`, `.credits10k`, …).

| Step | API | Notes |
| --- | --- | --- |
| Group | `POST /v1/subscriptionGroups` | `referenceName` e.g. `Pro` |
| Auto-renewable | `POST /v1/subscriptions` | `productId`, `subscriptionPeriod` (`ONE_MONTH` / `ONE_YEAR`) |
| Sub localization | `POST /v1/subscriptionLocalizations` | `en-US`, `tr`, … |
| Consumable | `POST /v2/inAppPurchases` | `/v1/inAppPurchases` CREATE is **403** |
| IAP localization | `POST /v1/inAppPurchaseLocalizations` | relate `inAppPurchaseV2` |
| Price / submit | Console | Agent opens Monetization URLs |

Then register the same `store_identifier`s in RevenueCat (**rc-launchpad**) and attach to packages.

## Credentials (never paste secrets into chat)

| Variable / path | Purpose |
| --- | --- |
| `ASC_ISSUER_ID` | Integrations page Issuer UUID |
| `ASC_KEY_ID` | API Key ID |
| `ASC_PRIVATE_KEY` | PEM string (EAS secret / `env:pull`) |
| `ASC_PRIVATE_KEY_PATH` | Absolute path to `.p8` (local file) |
| `scripts/app-store-connect/secrets/AuthKey_XXXXX.p8` | Local convention (gitignored) |
| `ASC_BUNDLE_ID` | e.g. `com.example.yourapp` |
| `ASC_APP_APPLE_ID` | Optional numeric App Store Connect Apple ID |
| `ASC_TEAM_ID` | Optional Apple Developer Team ID (multi-membership clarity) |
| `ASC_VERSION` | Optional marketing version string (e.g. `1.3.1`); else editable latest |

Create key: App Store Connect → **Users and Access → Integrations → App Store
Connect API → Generate API Key** (role **Admin** or **App Manager**). Download
`.p8` once — Apple will not show it again.

**Not required for this skill:** Apple ID password, app-specific password
(those are for Transporter / altool Apple-ID login only).

**Team sharing:** 1Password / Bitwarden shared vault — **never** git, Slack, or Notion.

### EAS project env (recommended)

Push the same vars to Expo EAS so agents / CI can `eas env:pull` without
committing `.p8`. Use **absolute** `ASC_PRIVATE_KEY_PATH` locally; on EAS store
the PEM as **`ASC_PRIVATE_KEY`** (`secret` visibility).

| Var | EAS visibility |
| --- | --- |
| `ASC_ISSUER_ID` | sensitive |
| `ASC_KEY_ID` | sensitive |
| `ASC_PRIVATE_KEY` | secret |
| `ASC_BUNDLE_ID` | plaintext |
| `ASC_TEAM_ID` | plaintext |
| `ASC_APP_APPLE_ID` | plaintext (optional) |

```bash
# example — never echo PEM into chat/logs
eas env:create --name ASC_ISSUER_ID --value "$ASC_ISSUER_ID" \
  --visibility sensitive --environment production --non-interactive
eas env:create --name ASC_PRIVATE_KEY --value "$(cat AuthKey_XXXXX.p8)" \
  --visibility secret --environment production --non-interactive
```

Repeat for `preview` / `development` as needed. Do **not** commit real Issuer,
Key ID, or PEM into this skill repo or app git history.

## Repo convention

```
scripts/app-store-connect/
  package.json          # jose, type: module
  secrets/              # gitignored .p8 + README
  src/
    client.mjs          # JWT + fetch wrapper
    metadata-catalog.mjs # locales + REVIEW (project-specific)
    auth-check.mjs
    resolve-app.mjs
    upsert-version-localizations.mjs
```

Scaffold with [scaffold.md](scaffold.md) when missing. Keep **project-specific**
copy in `metadata-catalog.mjs` only — skill logic stays generic.

### Suggested pnpm scripts

```json
{
  "auth:check": "node ./src/auth-check.mjs",
  "app:resolve": "node ./src/resolve-app.mjs",
  "metadata:upsert": "node ./src/upsert-version-localizations.mjs"
}
```

## Binary upload (v1 — document only)

IPA delivery is **out of band** for v1 scripts:

```bash
# Preferred for Expo
eas submit -p ios --path ./build.ipa

# Or Apple Transporter (GUI) with the correct provider / team
```

If Transporter returns `409` *`'NNNN' is not a valid ID for this relationship`*:
the IPA is often fine — ASC app ID / provider / agreements mismatch. See
[api-constraints.md](api-constraints.md). Fix ASC access, then retry the same IPA.

## Hard rules

1. **Never commit** `.p8`, Issuer/Key IDs in public chats, or real demo passwords
   in committed catalogs — use placeholders in the template; real values only in
   gitignored local overrides or env.
2. **Locale codes** must match ASC (`en-US`, `tr`, `es-ES`, `de-DE`, `zh-Hant`,
   `fr-FR`, `ar-SA`, …) — not arbitrary BCP-47 guesses. See api-constraints.
3. **Character limits** (Unicode code points): promotionalText ≤170, whatsNew ≤4000,
   description ≤4000, keywords ≤100, subtitle ≤30 (app info localization — future).
4. **Editable state:** `whatsNew` / description usually need a version in an
   editable state. **First version** often rejects `whatsNew` (`STATE_ERROR`) —
   omit it and set description / promotionalText / keywords only.
5. **gitignore** `**/secrets/**` except `secrets/README.md`; ignore `*.p8`.
6. Prefer **pnpm** (`pnpm install`, `pnpm <script>`) — not npm.
7. **Never** assume one team key sees all Voys apps — run `auth:check` and switch
   Issuer/Key when apps are missing.
8. **`POST /v1/apps` CREATE is forbidden** — New App is always a Console handoff.

## Quick commands

```bash
cd scripts/app-store-connect && pnpm install
export ASC_ISSUER_ID=... ASC_KEY_ID=... ASC_BUNDLE_ID=com.example.yourapp
# put AuthKey_XXXXX.p8 under secrets/
pnpm auth:check
pnpm app:resolve
pnpm metadata:upsert -- --dry-run
pnpm metadata:upsert
```

Pass `--version=1.3.1` to target a marketing version. After mutations, re-fetch
localizations and report locales + truncated what’s new.

## Additional resources

- Hard API traps: [api-constraints.md](./api-constraints.md)
- Scaffold checklist: [scaffold.md](./scaffold.md)
- Example flows: [examples.md](./examples.md)
- Click handoffs (agreements / API key UI): [../firebase-launchpad/handoffs.md](../firebase-launchpad/handoffs.md)
