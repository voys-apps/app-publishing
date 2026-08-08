---
name: play-launchpad
description: >-
  Automate Google Play Console via Android Publisher API: service-account
  auth, store listings EN/TR, icons/feature graphics/screenshots, one-time
  products and subscriptions (monetization APIs), closed testing tracks with
  Google Groups, and local AAB release drafts. Use when the user mentions Play
  Console, Play Store listing, closed testing, Google Play IAP, Android
  Publisher API, feature graphic upload, or wants to avoid manual Play forms /
  Playwright for Play setup. Works in any Android/React Native/Expo repo.
---

# Play Launchpad

Ship and maintain **any** Google Play app through the **Android Publisher API**.
Prefer API scripts over Playwright / browser automation for catalog, listing,
assets, and testing tracks.

**Install** (from the all-in-one publishing toolkit):

```bash
npx skills add voys-apps/app-publishing --skill play-launchpad
# or both Play + RC paywall skills:
npx skills add voys-apps/app-publishing -g
```

Reusable Node scripts live in this repo at `templates/play-console/` — copy into
app repos as `scripts/play-console/`.

Use this skill in **any** project. If the repo already has
`scripts/play-console/` (or similar), prefer those. Otherwise scaffold from the
template or [scaffold.md](scaffold.md). Do not invent endpoints — confirm
against live Google docs when writing or changing client code.

## When to use which tool

| Need | Tool |
| --- | --- |
| Auth / list products / upsert IAP & subs | Android Publisher API + `scripts/play-console` |
| Store listing text + contact details | `edits.listings` + `edits.details` |
| Icon / feature graphic / screenshots | `edits.images` (upload media) |
| Closed testing + Google Group | custom `CLOSED_TESTING` track + `edits.testers` |
| Local AAB publish | `edits.bundles.upload` + `edits.tracks` |
| Data Safety CSV | `applications.dataSafety` (only with verified answers) |
| Visual mock / feature graphic art | `GenerateImage`, then resize to **1024×500** |

**Do not** use Playwright to fill Play Console forms when the API covers the task.

## Consult official API docs

**Required before generating or changing API client code:**

1. Fetch / open official docs — do not invent paths or payloads:
   - Overview: https://developers.google.com/android-publisher
   - REST index: https://developers.google.com/android-publisher/api-ref/rest
   - Edits / tracks: https://developers.google.com/android-publisher/edits
   - One-time products: https://developers.google.com/android-publisher/api-ref/rest/v3/monetization.onetimeproducts
   - Subscriptions: https://developers.google.com/android-publisher/api-ref/rest/v3/monetization.subscriptions
   - Data Safety: https://developers.google.com/android-publisher/api-ref/rest/v3/applications/dataSafety
2. Confirm HTTP method, path, auth scope
   (`https://www.googleapis.com/auth/androidpublisher`), and field names.
3. Apply recipes in [api-constraints.md](api-constraints.md) and
   [scaffold.md](scaffold.md).

If docs and this skill disagree, **prefer live Google docs**, then update the
skill notes.

Use `WebFetch` / `WebSearch` in the same turn you scaffold or edit API code.

## Workflow

```
Task Progress:
- [ ] 1. Locate packageName + Play service-account JSON (never commit)
- [ ] 2. Enable Google Play Android Developer API + Play invite SA
- [ ] 3. auth:check (monetization.* + edits.insert — not legacy inappproducts)
- [ ] 4. Catalog: one-time products / subscriptions from project catalog
- [ ] 5. Listing text (limits) + details (email / website)
- [ ] 6. Assets: icon 512×512, feature graphic 1024×500, phone screenshots
- [ ] 7. Closed testing: create CLOSED_TESTING track + Google Group + draft/completed release
- [ ] 8. Report what API cannot do (draft-app first-launch blockers)
```

## Credentials (never paste secrets into chat)

| Variable / path | Purpose |
| --- | --- |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Absolute path to SA JSON |
| `GOOGLE_APPLICATION_CREDENTIALS` | Fallback path |
| `scripts/play-console/secrets/play-api-service-account.json` | Local convention (gitignored) |

**Team sharing:** 1Password / Bitwarden shared vault — **never** git, Slack, or Notion.

**Enable (Cloud project linked to Play):**

1. **Google Play Android Developer API** (`androidpublisher.googleapis.com`) — required
2. Play Developer Reporting API — optional (vitals only)
3. Play Console → Users and permissions → invite SA email with store / releases / monetization

Firebase `*-firebase-adminsdk-*.json` is **not** enough unless that same SA is invited in Play.

## Repo convention

```
scripts/play-console/
  package.json          # googleapis, type: module
  secrets/              # gitignored JSON keys + README
  src/
    client.mjs          # auth + androidpublisher v3
    catalog.mjs         # packageName, products, prices (project-specific)
    listing-catalog.mjs # EN/TR titles & descriptions
    auth-check.mjs
    upsert-credit-products.mjs      # monetization.onetimeproducts
    upsert-subscriptions.mjs
    upsert-store-listing.mjs
    upload-store-assets.mjs
    create-closed-test.mjs
```

Scaffold with [scaffold.md](scaffold.md) when missing. Keep **project-specific**
IDs/prices/copy in `catalog.mjs` / `listing-catalog.mjs` only — skill logic stays
generic.

### Suggested npm scripts

```json
{
  "auth:check": "node ./src/auth-check.mjs",
  "products:upsert-credits": "node ./src/upsert-credit-products.mjs",
  "subscriptions:upsert": "node ./src/upsert-subscriptions.mjs",
  "listing:upsert": "node ./src/upsert-store-listing.mjs",
  "listing:upload-assets": "node ./src/upload-store-assets.mjs",
  "testing:create-closed": "node ./src/create-closed-test.mjs"
}
```

## Hard rules

1. **Legacy `inappproducts` is often blocked** on apps migrated to the new
   catalog (“Please migrate to the new publishing API”). Use
   `monetization.onetimeproducts` and `monetization.subscriptions`.
2. **Closed testing:** do **not** assume track `beta` = closed. Create a custom
   track with `type: CLOSED_TESTING`, `formFactor: DEFAULT`. Assign testers via
   `googleGroups: ["group@googlegroups.com"]` (email lists unsupported by API).
3. **Draft apps:** first release on a never-published app may only allow
   `status: "draft"`. Promoting to `completed` fails with
   `Only releases with status draft may be created on draft app.` Tell the user
   to finish Play’s first-launch checklist / Start rollout in Console — API
   cannot bypass this.
4. **Listing limits:** title ≤30, shortDescription ≤80, fullDescription ≤4000
   (count Unicode code points, not bytes).
5. **Feature graphic:** exactly **1024×500** PNG. Phone screenshots: tall
   portrait PNGs. Icon: **512×512**.
6. **Data Safety:** only submit CSV answers that match real app behavior. Do
   not invent declarations.
7. **gitignore** service-account JSON and `**/secrets/**` (keep `secrets/README.md`).

## Quick commands

```bash
cd scripts/play-console && npm install
npm run auth:check
npm run products:upsert-credits
npm run listing:upsert
npm run listing:upload-assets
npm run testing:create-closed
```

Pass `--dry-run` where supported. After mutations, re-list tracks / products /
listings and report IDs + statuses.

## Additional resources

- Hard API traps: [api-constraints.md](api-constraints.md)
- Scaffold checklist: [scaffold.md](scaffold.md)
- Example flows: [examples.md](examples.md)
