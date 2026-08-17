# Local iOS CI/CD (no EAS cloud build or submit)

**Local first, always.** Use `pnpm build:ios` (`eas build -p ios --profile production --local`).  
**Never** fall back to `build:ios:cloud` / EAS cloud unless the user explicitly asks for cloud.  
If disk is full → free space and retry local. Do not “save the release” with cloud.

**Prefer local IPA upload** via `xcrun altool` + ASC API key — **not** `eas submit`, unless the user explicitly asks for EAS.

Keep root app `package.json` scripts unchanged.

## `.easignore` (required for local)

Same rule as Play: if `.easignore` exists, **do not** list `.env` / `.env.local` / `.env.*`.  
Still exclude `.p8` / `**/secrets/**`. See [play-launchpad local-android-ci.md](../play-launchpad/local-android-ci.md).

## Flow

```bash
# App repo — existing script (do not add new root scripts)
pnpm build:ios
# → *.ipa (path printed by eas; often project root)

cd scripts/app-store-connect
set -a && source ../../.env.local && set +a

# 1) Validate IPA auth (no upload)
pnpm ipa:validate -- --ipa=../../slide-ai-1.1.0-6.ipa

# 2) Upload to TestFlight (no Apple ID login — ASC API key only)
pnpm ipa:upload -- --ipa=../../slide-ai-1.1.0-6.ipa

# 3) Store version metadata (What's New, promo)
pnpm metadata:upsert -- --version=1.1.0

# 4) TestFlight "What to Test" (after build appears in ASC, ~5–15 min)
pnpm testflight:upsert-notes -- --version=1.1.0 --build=6 --wait-min=15
```

### Raw `altool` (no script)

```bash
set -a && source .env.local && set +a

xcrun altool --upload-app \
  -f ./slide-ai-1.1.0-6.ipa \
  --apiKey "$ASC_KEY_ID" \
  --apiIssuer "$ASC_ISSUER_ID" \
  --p8-file-path ./scripts/app-store-connect/secrets/AuthKey_<KEY_ID>.p8
```

**No Apple ID / 2FA** when using `--apiKey` + `--apiIssuer` + `.p8`.

## Agent rules

1. **Do not** use `eas build -p ios` without `--local`.
2. **Do not** use `build:ios:cloud` / `--auto-submit` unless the user asks.
3. **Default upload path:** `pnpm ipa:upload` (altool + ASC key). Use `eas submit` only if the user explicitly asks.
4. **Never** fall back to cloud. Local only; free disk and retry.
5. Ensure `.easignore` exists and **does not** ignore `.env*`.
6. Credentials: `eas credentials -p ios` once if local non-interactive build fails (Distribution Cert + App Store profile).
7. **Never Submit for Review** unless the user explicitly asks.
8. ASC REST API does **not** upload `.ipa` binaries — only metadata. Binary upload = `altool` / Transporter.

## Troubleshooting

| Issue | Fix |
| --- | --- |
| `VERIFY/UPLOAD failed` | Re-sign IPA; check Distribution cert + App Store profile |
| Build not in TestFlight yet | Wait 5–15 min; re-run `testflight:upsert-notes` with `--wait-min=15` |
| `eas submit` credential error in CI | Use `ipa:upload` instead — no EAS Submit credentials needed |
| Wrong app / 403 on metadata | Wrong-team `.p8` — run `pnpm auth:check` |
