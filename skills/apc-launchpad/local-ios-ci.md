# Local iOS CI/CD (EAS build only; ASC API upload)

**Local first, always.** Use `pnpm build:ios` (`eas build -p ios --profile production --local`).  
**Never** fall back to `build:ios:cloud` / EAS cloud unless the user explicitly asks for cloud.  
If disk is full → free space and retry local. Do not “save the release” with cloud.

**Never** `eas submit`. IPA → App Store Connect / TestFlight via **ASC REST** from the local machine (`scripts/app-store-connect` `ipa:upload`). EAS is **build only**.

Keep root app `package.json` scripts unchanged (do not add `ipa:upload` at repo root).

## `.easignore` (required for local)

Same rule as Play: if `.easignore` exists, **do not** list `.env` / `.env.local` / `.env.*`.  
Still exclude `.p8` / `**/secrets/**`. See [play-launchpad local-android-ci.md](../play-launchpad/local-android-ci.md).

## Flow

```bash
# 1) Local IPA — EAS only for this step
pnpm build:ios
# → *.ipa (path printed by eas; often project root; gitignored)

# 2) Upload to ASC / TestFlight — same .p8 as metadata (never eas submit)
pnpm --dir scripts/app-store-connect ipa:upload -- --ipa=./<file>.ipa
```

`--altool` (`xcrun altool --upload-package` + the same ASC API key) **only** if `POST /v1/buildUploads` is **404**. Still not EAS.

This does **not** Submit for Review.

## Proven ASC REST (live, 2026)

Script: `templates/app-store-connect/src/upload-ipa.mjs` → `ipa:upload`.

1. `POST /v1/buildUploads`  
   attributes: `cfBundleShortVersionString`, `cfBundleVersion`, `platform: "IOS"`  
   relationship: `app` → ASC Apple ID
2. `POST /v1/buildUploadFiles`  
   attributes: `fileName`, `fileSize`, `assetType: "ASSET"`, `uti: "com.apple.ipa"`  
   relationship: `buildUpload`
3. `PUT` each `uploadOperations[]` chunk in order. **Do not** add `Authorization` (pre-signed URLs).
4. `PATCH /v1/buildUploadFiles/{id}` with **only** `{ uploaded: true }`  
   Then `GET /v1/buildUploads/{id}` — `state` is nested (`attributes.state.state`). Expect `PROCESSING`, then TestFlight in 5–30 min.

### Live traps (do not “fix” these away)

| Symptom | What to do |
| --- | --- |
| `409 ENTITY_ERROR.ATTRIBUTE.INVALID` on `sourceFileChecksums` (`file.algorithm` / `file.hash`) | Omit checksums. Commit is `uploaded: true` only. OpenAPI `SHA_256` + hex/base64 MD5 were rejected live. |
| EAS prints **Build successful** + writes `./build-*.ipa`, then exits 1 `ENOTEMPTY` rmdir `…/build/.git` | Cleanup bug. **IPA is valid** — run `ipa:upload` on that file. Do not rebuild / do not cloud. |
| Chunks PUT succeeded, PATCH failed | Resume: `--file-id=<buildUploadFiles id> --upload-id=<buildUploads id>` (no re-PUT). |
| `POST /v1/buildUploads` **404** | `--altool` with the same `.p8`. |

## Agent rules

1. **Do not** use `eas build -p ios` without `--local`.
2. **Never** `eas submit`, `--auto-submit`, or `build:ios:cloud` unless the user explicitly asks for cloud **build**.
3. **Never** fall back to cloud. Local only; free disk and retry.
4. Ensure `.easignore` exists and **does not** ignore `.env*`.
5. Credentials: `eas credentials -p ios` once if local non-interactive fails (Distribution Cert + App Store profile).
6. After a local IPA exists, upload with `ipa:upload`. Do not open Transporter / EAS Submit.
7. **Never Submit for Review** unless the user explicitly asks.
