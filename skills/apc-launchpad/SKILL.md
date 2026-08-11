---
name: apc-launchpad
description: >-
  Automate App Store Connect via ASC API: JWT auth, bundle ID, subscription
  groups + auto-renewable + consumable IAPs (v2), prices/availability/equalizations,
  IAP review notes + screenshots, subscription-group localizations, app category /
  content rights / age ratings / free price schedule, version metadata + App Review
  notes, privacyPolicyUrl. Use when the user mentions App Store Connect, ASC,
  Unable to Add for Review, age rating, content rights, category, IAP pricing,
  What's New, promotional text, eas submit (upload only), or apc-launchpad.
  Works in any iOS / Expo repo. Pair with play-launchpad, rc-launchpad, store-assets.
  Never Submit for Review unless the user explicitly asks.
---

# APC Launchpad

Ship and maintain **any** App Store Connect listing through the **App Store
Connect API**. Prefer API over Console paste / Playwright when endpoints exist.

**Install:**

```bash
npx skills add voys-apps/app-publishing --skill apc-launchpad
# or entire toolkit:
npx skills add voys-apps/app-publishing -g
```

Reusable Node scripts: `templates/app-store-connect/` → copy as
`scripts/app-store-connect/`. Prefer existing scripts in the app repo. Do not
invent endpoints — confirm against live Apple docs ([api-constraints.md](api-constraints.md)).

## When to use which tool

| Need | Tool |
| --- | --- |
| Auth / list apps | ASC API + `pnpm auth:check` |
| Resolve Apple ID | `pnpm app:resolve` → `ASC_APP_APPLE_ID` |
| Register bundle ID | `POST /v1/bundleIds` |
| **Create ASC app record** | **Console only** (`POST /v1/apps` → 403) |
| Subs + consumable IAPs + prices + review shot/note | API — [IAP section](#iap--subscriptions-api--handoff) |
| Category / content rights / age rating / app free price | API — [App Information forms](#app-information-forms-unable-to-add-for-review) |
| Privacy Policy URL (App Information) | `PATCH` `appInfoLocalizations.privacyPolicyUrl` |
| **App Privacy practices** (nutrition labels) | **Console only** — Admin questionnaire |
| Version What’s New / promo / description / keywords | `pnpm metadata:upsert` |
| App Review notes (version) | upsert `REVIEW` (`contactPhone` `+CC …`) |
| Listing screenshots / previews | User / **store-assets**; upload Console (API deepen later) |
| IPA upload to ASC | `eas submit` — **does not** submit for review |
| Submit for Review | **Only if user explicitly asks** |
| Play Store | **play-launchpad** |

**Do not** use Playwright when the API covers the task.

## Multi-team keys (Voys)

ASC API keys are **per Apple Developer team / provider**, not per Gmail.

| Example | Team | Apps visible |
| --- | --- | --- |
| Receezy / Smart Receipt key | older Issuer | Receezy, Sokak Lambası, Smart Receipt |
| Aliye `skill-key` | e.g. `TMX779UK9D` | Words Journey, Varlık360, Slide AI, QuickDoc |

Missing expected app → wrong Issuer/Key. Switch `.env`. Account Holder UI ≠ `.p8` team.

## Consult official API docs

Before changing client code, fetch Apple docs (list apps, versions, localizations,
review details, subscriptions, age rating declarations, app price schedules).
JWT: `aud: appstoreconnect-v1`. Prefer live docs over this skill if they disagree.

## Workflow

```
Task Progress:
- [ ] 1. Correct-team ASC key (.p8) + ASC_BUNDLE_ID (+ ASC_TEAM_ID)
- [ ] 2. Scaffold scripts/app-store-connect; pnpm auth:check
- [ ] 3. App missing → bundleIds → Console New App → app:resolve → ASC_APP_APPLE_ID
- [ ] 4. App Information forms (category, content rights, age rating, free price, privacyPolicyUrl)
- [ ] 5. IAP: group + subs + consumables + EN/TR + group locs + availability + prices/equalizations
- [ ] 6. Ask user for paywall screenshots → upload review shots + real reviewNotes
- [ ] 7. metadata-catalog + upsert (omit whatsNew on first version if STATE_ERROR)
- [ ] 8. RC: create-app app_store + SKUs (rc-launchpad); ASC credentials in RC dashboard
- [ ] 9. EAS iOS credentials (interactive once) → eas build → eas submit (upload only)
- [ ] 10. User: App Privacy practices + listing screenshots → Submit for Review only if asked
```

## App Information forms (“Unable to Add for Review”)

When ASC shows **Unable to Add for Review**, clear what the API allows **before**
asking the user to click. Full recipes: [review-forms.md](review-forms.md).

| Blocker | Agent action |
| --- | --- |
| Primary Category | `PATCH /v1/appInfos/{id}` → `primaryCategory` (e.g. `PRODUCTIVITY`) |
| Content Rights | `PATCH /v1/apps/{id}` → `contentRightsDeclaration` (`DOES_NOT_USE_THIRD_PARTY_CONTENT` or `USES_THIRD_PARTY_CONTENT`) |
| Age Ratings | `PATCH /v1/ageRatingDeclarations/{id}` — fill **all required** attrs (booleans vs enums; see review-forms) |
| Price Tier | `POST /v1/appPriceSchedules` with USA **$0** `appPricePoint` for free apps |
| Privacy Policy URL | `PATCH` each `appInfoLocalizations` → `privacyPolicyUrl` (canonical `https://voysapps.io/app/<slug>/privacy-policy`) |
| Privacy Practices | **Console** App Privacy — open URL; agent cannot complete nutrition labels via API |
| Build | `eas credentials -p ios` (interactive if unset) → `eas build -p ios` → `eas submit -p ios --latest` |
| Screenshots | Leave to user / store-assets — **do not** invent listing art unless asked |

**Never** click / API-submit **Submit for Review** unless the user explicitly asks.

## IAP / subscriptions (API + handoff)

Reverse-DNS IDs shared with Play when possible.

| Step | API | Notes |
| --- | --- | --- |
| Group | `POST /v1/subscriptionGroups` | e.g. `Pro` |
| Group localization | `POST /v1/subscriptionGroupLocalizations` | `name` + optional `customAppName`; locales `en-US`, `tr` — empty “Localization / Create” on group page blocks polish |
| Auto-renewable | `POST /v1/subscriptions` | `ONE_MONTH` / `ONE_YEAR` |
| Sub localization | `POST /v1/subscriptionLocalizations` | EN/TR; description ≤55 |
| Consumable | `POST /v2/inAppPurchases` | `/v1` CREATE **403** |
| IAP localization | `POST /v1/inAppPurchaseLocalizations` | relate `inAppPurchaseV2` |
| Sub availability | `POST /v1/subscriptionAvailabilities` | all territories + `availableInNewTerritories: true` |
| Sub prices | `POST /v1/subscriptionPrices` + equalizations | USA base then **every** equalization — missing territories → `MISSING_METADATA`; Console may look empty until refresh / full equalize |
| IAP availability | `POST /v1/inAppPurchaseAvailabilities` | required for consumables → Ready to Submit |
| IAP prices | `POST /v1/inAppPurchasePriceSchedules` | USA base price point |
| Review note | `PATCH` `reviewNote` | Real how-to + Product ID + prices + grant — **not** “see docs” |
| Review screenshot | reserve → PUT → PATCH commit | **Ask user** for Pro + credits paywall PNGs; upscale **1290×2796**; tiny exports → `IMAGE_INCORRECT_DIMENSIONS`; `DELETE` FAILED then retry |
| Ready to Submit | Poll `state` | Target `READY_TO_SUBMIT` |

Then **rc-launchpad**: same `store_identifier`s → packages + entitlement.

## Credentials (never paste secrets into chat)

| Variable / path | Purpose |
| --- | --- |
| `ASC_ISSUER_ID` / `ASC_KEY_ID` / `ASC_PRIVATE_KEY` or `_PATH` / `secrets/AuthKey_*.p8` | JWT |
| `ASC_BUNDLE_ID` / `ASC_APP_APPLE_ID` / `ASC_TEAM_ID` / `ASC_VERSION` | Targeting |

Push Issuer / Key ID / PEM to EAS env (`secret` for PEM). Never commit `.p8`.

### EAS iOS build credentials

Non-interactive `eas build -p ios` fails with **Credentials are not set up** until
Distribution Cert + App Store profile exist. Agent should:

1. Tell user to run `eas credentials -p ios` once (interactive), **or**
2. Run it if the session can complete interactive approval
3. Then `EAS_BUILD_NO_EXPO_GO_WARNING=true eas build -p ios --profile production`
4. `eas submit -p ios --latest` → ASC processing only (**not** App Review)

## Repo convention

```
scripts/app-store-connect/
  package.json
  secrets/              # gitignored .p8
  src/client.mjs
  src/metadata-catalog.mjs
  src/auth-check.mjs
  src/resolve-app.mjs
  src/upsert-version-localizations.mjs
```

## Hard rules

1. Never commit `.p8` / real demo passwords.
2. ASC locale codes exactly (`en-US`, `tr`, …).
3. Character limits: promotionalText ≤170, whatsNew/description ≤4000, keywords ≤100.
4. First version: omit `whatsNew` if `STATE_ERROR`.
5. Prefer **pnpm**.
6. Never assume one team key sees all apps — `auth:check`.
7. `POST /v1/apps` CREATE forbidden.
8. **Never Submit for Review** unless the user explicitly asks.
9. Console-only: New App, Paid Apps agreement accept, **App Privacy practices**, listing screenshot upload (until API deepen).

## Quick commands

```bash
cd scripts/app-store-connect && pnpm install
pnpm auth:check && pnpm app:resolve
pnpm metadata:upsert -- --dry-run && pnpm metadata:upsert
```

## Additional resources

- Review form recipes: [review-forms.md](./review-forms.md)
- Hard API traps: [api-constraints.md](./api-constraints.md)
- Scaffold: [scaffold.md](./scaffold.md)
- Examples: [examples.md](./examples.md)
- Click handoffs: [../firebase-launchpad/handoffs.md](../firebase-launchpad/handoffs.md)
