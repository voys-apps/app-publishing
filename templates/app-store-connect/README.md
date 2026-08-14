# App Store Connect scripts (template)

Node + `jose` helpers for App Store Connect API (metadata / review notes).

## Setup

```bash
# from an app repo
cp -R <path-to-app-publishing>/templates/app-store-connect scripts/app-store-connect
cd scripts/app-store-connect
pnpm install
```

1. Edit `src/metadata-catalog.mjs` (bundle id, locales, review notes)
2. Put `AuthKey_XXXXX.p8` at `secrets/` (gitignored)
3. Export `ASC_ISSUER_ID`, `ASC_KEY_ID`, `ASC_BUNDLE_ID`

```bash
pnpm auth:check
pnpm app:resolve
pnpm metadata:upsert -- --dry-run
pnpm metadata:upsert -- --version=1.0.0
```

See skill **apc-launchpad** for JWT traps, locale codes, and Transporter 409 notes.

IPA upload is local ASC API (never `eas submit`). EAS is build-only:

```bash
pnpm build:ios
pnpm --dir scripts/app-store-connect ipa:upload -- --ipa=./<file>.ipa
```

Commit is `PATCH /v1/buildUploadFiles/{id}` with `{ uploaded: true }` only.
Do not send `sourceFileChecksums` (`SHA_256` → live 409). `--altool` only if REST 404.

