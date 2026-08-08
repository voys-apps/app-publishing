# Play Launchpad — API constraints

## Auth errors

| Symptom | Cause | Fix |
| --- | --- | --- |
| `SERVICE_DISABLED` / API not used | Android Publisher API off | Enable `androidpublisher.googleapis.com` on the Cloud project tied to the SA (Owner SA can enable via Service Usage) |
| `403` Permission denied to get/enable service | SA is not GCP **Owner** (or missing Service Usage) | Grant **Owner** on `project_id` from the JSON; retry — agents then enable APIs / IAM themselves |
| `403` after API enabled (Play calls) | SA not invited in Play | Play Console → Users and permissions → invite `client_email` |
| Firebase SA works for Firebase only | Wrong product | Use Play-linked SA JSON |

## GCP Owner (required for Voys toolkit)

The Play SA JSON is not only a Play Publisher credential. **Require GCP project
Owner** on that SA so agents can use the full permission set:

- Enable Google APIs (`serviceusage.services.enable`)
- Bind IAM roles (`pubsub.editor`, `monitoring.viewer`, etc.)
- Create Pub/Sub topics + RTDN publisher grants (see **rc-forge**)

Least-privilege / Play-only SAs are a footgun for this toolkit: automation stops
mid-flow with opaque 403s. Document Owner as the default; if the user refuses
Owner, they must run Cloud Console steps themselves — still prefer asking for
Owner first.

## RevenueCat handoff (same SA JSON)

The Play Publisher SA JSON is also what RevenueCat needs for the **Play Store app**
connection. **RC API/MCP cannot upload it** — user must paste in RC dashboard
(Service credentials). See **rc-forge** [`api-constraints.md`](../rc-forge/api-constraints.md)
§ Play Store app connection (incl. Owner + Pub/Sub). Do not block Play listing/IAP
work on that step; do warn when the user later hits RC “Connection issue” /
missing store credentials.

## Catalog model

| Approach | When |
| --- | --- |
| `monetization.onetimeproducts` (+ `purchaseOptions`) | **Default** for one-time / consumable credits |
| `monetization.subscriptions` (+ `basePlans`) | Auto-renewing subscriptions |
| `inappproducts.*` | Legacy only — often returns `Please migrate to the new publishing API` |

### One-time product create tips

- Prefer `oneTimeProducts:batchUpdate` with `allowMissing: true`.
- Set `regionsVersion.version` (e.g. current Play regions version from an existing product or docs).
- `newRegionsConfig` usually needs **both** `usdPrice` and `eurPrice`.
- New purchase options often land as `DRAFT`. Activate via
  `.../oneTimeProducts/-/purchaseOptions:batchUpdateStates` with
  `activatePurchaseOptionRequest` (not a per-option `:activate` that many
  client libs lack).
- Consumable vs non-consumable is mostly **app-side consume** + option config;
  mirror an existing ACTIVE product in the same app when unsure.

### Subscription tips

- Product ID + `basePlanId` (e.g. `monthly` / `yearly`).
- Billing periods ISO-8601: `P1M`, `P1Y`.
- Activate base plans after create when needed
  (`basePlans.activate` or batch state updates).

## Edits pattern

Always:

1. `edits.insert`
2. Mutate (listings / images / tracks / testers / bundles)
3. `edits.commit`
4. On failure: `edits.delete` for that editId

Never reuse a stale edit after another commit or Console change.

## Tracks & testing

| Track name | Meaning |
| --- | --- |
| `internal` | Internal testing |
| `production` | Production |
| `beta` | Often **Open testing** in upgraded consoles — **not** safe to assume “closed” |
| custom e.g. `receezy-closed` | Create with `tracks.create` + `type: CLOSED_TESTING` |

Testers resource:

```json
{ "googleGroups": ["your-group@googlegroups.com"] }
```

Email lists from the Console UI are **not** supported by the API.

### Draft app blocker

If commit fails with:

`Only releases with status draft may be created on draft app.`

→ App has never left first-publish draft. You may only stage `status: "draft"`
releases via API. User must complete Play’s first-launch requirements and
**Start rollout** in Console. Do not loop API retries expecting a bypass.

If commit fails with:

`The beta track has been upgraded to use open or closed testing; switch back to communities-based testing...`

→ Stop using legacy `beta` for closed groups; create a **new** `CLOSED_TESTING`
track instead.

## Listing limits

Validate with Unicode length (`[...str].length`):

| Field | Max |
| --- | --- |
| title | 30 |
| shortDescription | 80 |
| fullDescription | 4000 |

## Assets

| Type | `imageType` | Spec |
| --- | --- | --- |
| High-res icon | `icon` | 512×512 PNG |
| Feature graphic | `featureGraphic` | **1024×500** PNG |
| Phone screenshots | `phoneScreenshots` | Portrait PNG (upload 2–8) |

Upload language: usually default listing language (e.g. `en-US`). Clear with
`images.deleteall` before re-upload when replacing a full set.

Resize feature graphics with `sips` (macOS) or equivalent before upload.

## Data Safety

`applications.dataSafety` body: `{ "safetyLabels": "<csv string>" }`.

CSV format: Play Help “Export to a CSV file” / Data safety CSV docs. Only submit
answers verified against the real app (analytics, account data, purchases, etc.).
