# Play Console scripts (template)

Node + `googleapis` helpers for Google Play Android Publisher API.

## Setup

```bash
# from an app repo
cp -R <path-to-app-publishing>/templates/play-console scripts/play-console
cd scripts/play-console
pnpm install
```

1. Edit `src/catalog.mjs`, `src/listing-catalog.mjs`, `src/assets-catalog.mjs`
2. Put service-account JSON at `secrets/play-api-service-account.json` (gitignored)
3. Invite the SA in Play Console; enable **Google Play Android Developer API**

```bash
pnpm auth:check
pnpm products:upsert-credits
pnpm subscriptions:upsert
pnpm listing:upsert
pnpm listing:upload-assets
pnpm testing:create-closed -- --track=my-closed --group=testers@googlegroups.com
```

Pass `--dry-run` where supported.

See skill **play-launchpad** in this repo for API traps (legacy `inappproducts`,
draft-app closed testing, listing limits).
