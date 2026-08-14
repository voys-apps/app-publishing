# APC Launchpad — examples

## Example A — Upload What’s New after IPA is in ASC

User: “1.3.1 release notes’u App Store’a yükle”

1. Confirm `ASC_ISSUER_ID` / `ASC_KEY_ID` / `.p8` / `ASC_BUNDLE_ID` (never paste
   real secrets into chat).
2. `pnpm auth:check`
3. `pnpm app:resolve` — Apple ID must match App Information.
4. Paste What’s New + promotional text into `metadata-catalog.mjs` per locale
   (from `v1.x-release-notes.txt` or similar). Keep `promotionalText` ≤170
   Unicode code points.
5. Optionally set `REVIEW` (demo account + notes) — keep real passwords local-only.
6. `pnpm metadata:upsert -- --version=1.3.1 --dry-run`
7. `pnpm metadata:upsert -- --version=1.3.1`
8. Report updated locales + review detail id. Version should be editable
   (e.g. `PREPARE_FOR_SUBMISSION`).

## Example B — New Expo app, no scripts yet

User opens an app without `scripts/app-store-connect/`.

1. Scaffold from [scaffold.md](scaffold.md) / copy `templates/app-store-connect`.
2. Set env + drop `AuthKey_*.p8` into `secrets/`.
3. Edit `BUNDLE_ID` + catalog copy for that app.
4. `pnpm auth:check` before any mutation.

## Example C — Transporter 409 relationship ID

User: “Transporter `'6759799925' is not a valid ID for this relationship`”

1. Do **not** rebuild IPA first.
2. `pnpm app:resolve` with the same team key — compare printed id to ASC
   App Information → Apple ID.
3. Check Agreements, Tax, and Banking; confirm Transporter **provider** matches
   the signing team.
4. Retry same IPA after ASC access is fixed.

## Example D — Review notes only

User: “App Review notes’u güncelle, demo hesap şu”

1. Put notes + demo fields in `REVIEW` (local only; do not commit real passwords).
2. `pnpm metadata:upsert -- --review-only` (or full upsert with empty
   localization changes — template supports `--review-only`).
3. Confirm in ASC → App Review Information.

## Example E — Wrong tool

User: “ASC formlarını Playwright ile doldur”

→ Decline form-filling when API covers What’s New / promo / review notes.
Use APC Launchpad. Browser only for Console-only steps (API key create UI,
Paid Apps Agreement accept).

## Example F — Wire ASC key into EAS (no secrets in git)

User: “Skill-key .p8’i EAS env’e koy”

1. Copy `.p8` to `scripts/app-store-connect/secrets/` (gitignored).
2. Set local `.env.local` with Issuer / Key ID / absolute `ASC_PRIVATE_KEY_PATH`
   (file is gitignored).
3. `eas env:create` for `ASC_ISSUER_ID`, `ASC_KEY_ID`, `ASC_PRIVATE_KEY` (PEM),
   `ASC_BUNDLE_ID`, `ASC_TEAM_ID` on production/preview/development.
4. `pnpm auth:check` locally — list apps; confirm target bundle.
5. Never commit `.p8`, never paste PEM into PRs or skill repo.

## Example G — New iOS app + IAP + RC (QuickDoc-style)

User: “ASC’de app açtım; abonelik + RC + metadata”

1. Confirm **correct team** key (`auth:check` shows the new app).
2. `ASC_APP_APPLE_ID` from `app:resolve`.
3. App Information forms ([review-forms.md](review-forms.md)): category, content rights, age rating, free price, privacyPolicyUrl, **subtitle** (≤30).
4. API IAP: group + group locs + subs + `/v2/inAppPurchases` + EN/TR + availability + prices/equalizations.
5. Ask user for Pro + credits paywall screenshots → review shots + notes → `READY_TO_SUBMIT`.
6. `rc-launchpad`: `create-app` `app_store` + SKUs + packages; RC dashboard ASC credentials.
7. Metadata upsert (omit `whatsNew` on first version if STATE_ERROR).
8. User: App Privacy practices + listing screenshots; `eas credentials` → **`pnpm build:ios`** (local). `eas submit` only if they ask.
9. **Do not** Submit for Review unless asked.

## Example H — Unable to Add for Review

User pastes ASC red box (category, age rating, content rights, price, privacy, build).

1. Fix all API-capable rows from [review-forms.md](review-forms.md) in one pass.
2. Open App Privacy URL for practices (Console).
3. Build: if EAS says credentials not set up → user runs `eas credentials -p ios`, then agent **`pnpm build:ios`** (local). Do not cloud-build or `eas submit` unless asked.
4. Screenshots: leave to user unless they ask for store-assets.
5. Confirm remaining blockers; never submit for review unbidden.

## Example J — App subtitle

User: “Subtitle ekle” / App Information subtitle empty

1. Draft ≤30 code-point lines for `en-US` + `tr` (ask user if brand voice unclear).
2. List `appInfoLocalizations` → `PATCH` `subtitle` on each.
3. Confirm in ASC App Information; document pattern in [review-forms.md](review-forms.md).

## Example I — Console prices look empty but API has them

1. `GET /v1/subscriptions/{id}/prices?filter[territory]=USA` — confirm `customerPrice`.
2. Compare price count to territory count; finish equalizations if short.
3. Tell user to hard-refresh ASC; monthly/yearly should move to Ready to Submit.
