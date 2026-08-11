# Play Launchpad — scaffold

When `scripts/play-console/` is missing, **prefer copying** the ready template
from this skill’s parent repo:

```bash
# if app-publishing is cloned locally:
cp -R /path/to/app-publishing/templates/play-console your-app/scripts/play-console
```

Or recreate the same layout below. Prefer **Node + `googleapis`**.

## Minimal `package.json`

```json
{
  "name": "play-console",
  "private": true,
  "type": "module",
  "scripts": {
    "auth:check": "node ./src/auth-check.mjs",
    "products:upsert-credits": "node ./src/upsert-credit-products.mjs",
    "subscriptions:upsert": "node ./src/upsert-subscriptions.mjs",
    "listing:upsert": "node ./src/upsert-store-listing.mjs",
    "listing:upload-assets": "node ./src/upload-store-assets.mjs",
    "testing:create-closed": "node ./src/create-closed-test.mjs"
  },
  "dependencies": {
    "googleapis": "^164.0.0"
  }
}
```

## `src/client.mjs` responsibilities

- Resolve key path: env → `secrets/play-api-service-account.json`
- `GoogleAuth` scope: `https://www.googleapis.com/auth/androidpublisher`
- Export `getAndroidPublisher()`, `formatApiError()`, `resolveCredentialsPath()`

## `src/catalog.mjs` (project-specific)

Export at least:

- `PACKAGE_NAME` (e.g. `com.company.app`)
- Credit / one-time product rows: `sku`, titles EN/TR, descriptions, `priceUsd`
- Subscription rows: `productId`, `basePlanId`, `billingPeriodDuration`, titles, `priceUsd`
- Helpers: `usdToMicros` / Money proto `{ currencyCode, units, nanos }`

## `src/listing-catalog.mjs` (project-specific)

- `STORE_LISTINGS['en-US' | 'tr-TR']` with title / short / full
- `APP_DETAILS` with `defaultLanguage`, `contactEmail`, `contactWebsite`
- `assertListingLimits(lang, listing)`

## `secrets/`

```
secrets/
  .gitignore          # ignore * except README
  README.md           # where to put the JSON
  play-api-service-account.json   # local only
```

Root `.gitignore` should include:

```
**/secrets/**
!**/secrets/README.md
*service-account*.json
google-play-api*.json
```

## auth-check

Do **not** rely only on `inappproducts.list`. Prefer parallel:

- `monetization.onetimeproducts.list`
- `monetization.subscriptions.list`
- `edits.insert` then `edits.delete`

Print counts + productIds. Exit non-zero on auth/API failure.

## Assets folder convention (optional)

```
assets/play-store/
  feature-graphic.png      # 1024×500
  screenshot-*.png
```

Icon often already exists at `assets/.../playstore.png` (512×512).

## Closed / alpha script inputs

Make track name + Google Group **configurable** (CLI args or env), e.g.:

- `--track=alpha` (default when env unset — **preferred**)
- `--group=testers@googlegroups.com` (optional; ask first)
- Reject / never default to `receezy` / `receezy-closed`

**Do not** create tracks. If the target track is missing after `edits.tracks.list`,
fail with a clear message listing existing tracks — Console or user decides.

```js
// BAD — do not scaffold auto-create
// await androidpublisher.edits.tracks.create({ ... })

const tracks = await androidpublisher.edits.tracks.list({ packageName, editId })
const names = (tracks.data.tracks || []).map(t => t.track)
if (!names.includes(trackName)) {
  throw new Error(`Track "${trackName}" missing. Existing: ${names.join(', ')}. Do not create tracks.`)
}
if (/^receezy/i.test(trackName)) {
  throw new Error(`Track "${trackName}" is off-limits (receezy*). Use alpha or ask the user.`)
}
```

Use latest `edits.bundles.list` versionCode unless user supplies an AAB path to upload.
