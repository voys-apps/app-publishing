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
