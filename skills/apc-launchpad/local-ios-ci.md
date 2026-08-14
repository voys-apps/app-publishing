# Local iOS CI/CD (no EAS cloud build)

**Local first, always.** Use `pnpm build:ios` (`eas build -p ios --profile production --local`).  
**Never** fall back to `build:ios:cloud` / EAS cloud unless the user explicitly asks for cloud.  
If disk is full → free space and retry local. Do not “save the release” with cloud.

**Never** `eas submit` unless the user explicitly asks to upload the IPA to ASC / TestFlight.

Keep root app `package.json` scripts unchanged.

## `.easignore` (required for local)

Same rule as Play: if `.easignore` exists, **do not** list `.env` / `.env.local` / `.env.*`.  
Still exclude `.p8` / `**/secrets/**`. See [play-launchpad local-android-ci.md](../play-launchpad/local-android-ci.md).

## Flow

```bash
# App repo — existing script (do not add new root scripts)
pnpm build:ios
# → *.ipa (path printed by eas; often project root)

# Upload to TestFlight / ASC only if the user asks:
# pnpm submit:ios -- --path=./<file>.ipa --non-interactive
```

## Agent rules

1. **Do not** use `eas build -p ios` without `--local`.
2. **Do not** use `build:ios:cloud` / `--auto-submit` / `eas submit` unless the user asks.
3. **Never** fall back to cloud. Local only; free disk and retry.
4. Ensure `.easignore` exists and **does not** ignore `.env*`.
5. Credentials: `eas credentials -p ios` once if local non-interactive fails (Distribution Cert + App Store profile).
6. **Never Submit for Review** unless the user explicitly asks.
