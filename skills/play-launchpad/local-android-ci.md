# Local Android CI/CD (no EAS Submit)

Prefer **local EAS build + Play Publisher API upload** over `eas submit`.

## Flow

```bash
# App repo root — needs Docker for eas --local
pnpm build:android
# → writes *.aab in project root (or path printed by eas)

# Upload + closed track (Play SA Owner JSON)
export GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=./scripts/play-console/secrets/play-api-service-account.json
export PLAY_CLOSED_TRACK=receezy-closed          # or app-specific track
export PLAY_CLOSED_GROUP=receezy@googlegroups.com

pnpm --dir scripts/play-console testing:upload-aab -- \
  --aab="$(ls -t ./*.aab | head -1)" \
  --track="$PLAY_CLOSED_TRACK" \
  --group="$PLAY_CLOSED_GROUP" \
  --status=completed
```

Or one-shot (after `build:android` script exists):

```bash
pnpm release:android:local
```

## Scripts

| Script | Role |
| --- | --- |
| App `pnpm build:android` | `eas build -p android --profile production --local --non-interactive` |
| `scripts/play-console` `testing:upload-aab` | `edits.bundles.upload` + testers + track release |
| `testing:create-closed` | Re-point track to **latest already-uploaded** bundle (no new AAB) |

## Agent rules

1. **Do not** use `eas submit` for this path unless the user asks.
2. Ensure Docker is running before local EAS build.
3. `versionCode` must be **greater** than any bundle already on Play (`edits.bundles.list`).
   With `eas.json` `cli.appVersionSource: remote` + `production.autoIncrement`, EAS bumps remote;
   confirm with `eas build:version:get -p android` if upload fails on version conflict.
4. On upload/API failure: retry once; if draft-app blocker, open Console first-launch handoff.
5. Creating Google Groups / Reddit posts still requires user **yes** — see [closed-testing.md](./closed-testing.md).

## Verify

```bash
cd scripts/play-console
pnpm auth:check
# then list track (inline or dry-run helpers)
```

Report: track name, status, versionCode, googleGroups.
