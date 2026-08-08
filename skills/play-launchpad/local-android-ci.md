# Local Android CI/CD (no EAS Submit, no cloud build)

**Local first, always.** Use `pnpm build:android` (`eas build … --local`).  
**Never** fall back to `build:android:cloud` / EAS cloud unless the user explicitly asks for cloud.  
If disk is full → free space and retry local. Do not “save the release” with cloud.

Keep root app `package.json` scripts unchanged — use `scripts/play-console` only.

## `.easignore` (required for local)

EAS packs the project using **`.easignore` if present**, otherwise **`.gitignore`**.

`.gitignore` usually excludes `.env` / `.env.*`. That breaks **local** builds that rely on
`.env.local` (AdMob, Supabase, RC, etc.) being present in the pack.

**Agent rule:** if the app repo has **no** `.easignore`, create one:

1. Copy bulky / native / secret excludes from `.gitignore` (or a sensible default).
2. **Do not** list `.env`, `.env.local`, or `.env.*` in `.easignore`.
3. Still exclude SA JSON / `**/secrets/**` / `*service-account*.json` — those are not app runtime env.
4. Tell the user briefly that `.easignore` was added so local builds keep env files.

QuickDoc example lives at repo root `.easignore`.

## Flow

```bash
# App repo — existing script (do not add new root scripts)
pnpm build:android
# → *.aab (path printed by eas; often project root)

cd scripts/play-console
export GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=./secrets/play-api-service-account.json
export PLAY_CLOSED_TRACK=receezy-closed
export PLAY_CLOSED_GROUP=receezy@googlegroups.com

pnpm testing:upload-aab -- \
  --aab="$(ls -t ../../*.aab | head -1)" \
  --track="$PLAY_CLOSED_TRACK" \
  --group="$PLAY_CLOSED_GROUP" \
  --status=completed
```

## Scripts (play-console only)

| Script | Role |
| --- | --- |
| App `pnpm build:android` | Existing app script — do not fork in root |
| `pnpm testing:upload-aab` | `edits.bundles.upload` + testers + track |
| `pnpm testing:create-closed` | Latest already-uploaded bundle → track |

## Agent rules

1. **Do not** add `play:*` / `release:android:local` to the app root `package.json`.
2. **Do not** use `eas submit` for this path unless the user asks.
3. **Never** fall back to cloud. Local only; free disk and retry.
4. Ensure `.easignore` exists and **does not** ignore `.env*`.
5. `versionCode` must exceed Play’s max (`edits.bundles.list`).
6. Google Group / Reddit still **ask first** — [closed-testing.md](./closed-testing.md).
