# APC Launchpad — scaffold

When `scripts/app-store-connect/` is missing, **prefer copying** the ready
template from this skill’s parent repo:

```bash
# if app-publishing is cloned locally:
cp -R /path/to/app-publishing/templates/app-store-connect your-app/scripts/app-store-connect
```

Or recreate the same layout below. Prefer **Node ESM + `jose`** (JWT ES256).

## Minimal `package.json`

```json
{
  "name": "app-store-connect-scripts",
  "private": true,
  "type": "module",
  "scripts": {
    "auth:check": "node ./src/auth-check.mjs",
    "app:resolve": "node ./src/resolve-app.mjs",
    "metadata:upsert": "node ./src/upsert-version-localizations.mjs",
    "ipa:upload": "node ./src/upload-ipa.mjs",
    "ipa:upload-local": "node ./src/upload-ipa-local.mjs",
    "ipa:validate": "node ./src/upload-ipa-local.mjs -- --validate-only",
    "testflight:upsert-notes": "node ./src/upsert-beta-build-localizations.mjs"
  },
  "dependencies": {
    "jose": "^5.9.6"
  }
}
```

## `src/client.mjs` responsibilities

- Resolve `.p8` path: `ASC_PRIVATE_KEY_PATH` → `secrets/AuthKey_*.p8` (first match)
- Require `ASC_ISSUER_ID` + `ASC_KEY_ID`
- Mint ES256 JWT (`aud: appstoreconnect-v1`, ~20 min)
- `ascFetch(path, { method, body })` → JSON:API helpers
- Export `formatApiError()`, `resolvePrivateKeyPath()`, `getConfig()`

## `src/metadata-catalog.mjs` (project-specific)

Export:

- `BUNDLE_ID` (or read `ASC_BUNDLE_ID`)
- `VERSION_LOCALIZATIONS` map: locale → `{ whatsNew?, promotionalText?, description?, keywords?, supportUrl?, marketingUrl? }`
- `TESTFLIGHT_BUILD_LOCALIZATIONS` map: locale → `{ whatsNew? }` for TestFlight “What to Test”
- Optional `REVIEW`: `{ notes?, demoAccountName?, demoAccountPassword?, demoAccountRequired? }`
- `assertMetadataLimits(locale, row)`

Use placeholders in the shipped template (`com.example.yourapp`).

## `secrets/`

```
secrets/
  .gitignore          # ignore * except README
  README.md           # where to put Issuer / Key ID / .p8
  AuthKey_XXXXXX.p8   # local only
```

Root / template `.gitignore` should include:

```
**/secrets/**
!**/secrets/README.md
!**/secrets/.gitignore
*.p8
AuthKey_*.p8
```

## Env checklist

```bash
export ASC_ISSUER_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
export ASC_KEY_ID="XXXXXXXXXX"
export ASC_BUNDLE_ID="com.example.yourapp"
# optional:
export ASC_PRIVATE_KEY_PATH="/absolute/path/AuthKey_XXX.p8"
export ASC_APP_APPLE_ID="6759799925"
export ASC_VERSION="1.3.1"
export ASC_TEAM_ID="XXXXXXXXXX"
```

## auth-check

- Mint JWT
- `GET /v1/apps?limit=50`
- Print id + bundleId + name for each
- Exit non-zero on auth failure

## resolve-app

- Prefer `ASC_APP_APPLE_ID` if set (GET app)
- Else `filter[bundleId]=ASC_BUNDLE_ID`
- Print Apple ID + bundle + name; exit 1 if missing / ambiguous

## metadata upsert

1. Resolve app
2. Resolve iOS `appStoreVersion` (`ASC_VERSION` or latest editable)
3. For each locale in catalog: find localization or POST create
4. PATCH attributes present in catalog
5. If `REVIEW` set: GET/PATCH `appStoreReviewDetail`
6. Support `--dry-run`

## Binary (no scaffold script in v1)

Local IPA: `pnpm build:ios` (`--local`). Never EAS cloud unless asked.  
Upload: Transporter or `eas submit` **only if the user asks**. Do not invent altool wrappers.
