# RevenueCat API constraints (catalog + shared)

## Auth

- Header: `Authorization: Bearer sk_…` (API **v2** secret)
- Scope: Project configuration Read & write for catalog + paywall mutations
- Public SDK keys (`appl_` / `goog_`) cannot call these endpoints

## Play Store app connection (service account JSON)

**Public API v2 / MCP cannot upload Google Play service-account credentials.**

| What agents CAN do | What agents CANNOT do |
| --- | --- |
| `create-app` with `type: play_store` + `package_name` | Attach / replace SA JSON via REST or MCP |
| Register products (`productId:basePlanId` / SKUs) | Fix dashboard “Connection issue” / “Missing credentials for the store” by API |
| Attach products to packages / entitlements | |

When the user (or dashboard) shows **Connection issue** / **Make sure the Service Account Credentials JSON is configured properly** / store-state `Missing credentials for the store`:

1. Tell the user to open RevenueCat → the **Play Store app** → **Service credentials (Google Play)**.
2. Upload or paste the same SA JSON used for Play Android Publisher (app repo convention: `scripts/play-console/secrets/play-api-service-account.json`).
3. Save. Validator may take minutes–hours (RC docs: up to ~36h).
4. Play Console → Users and permissions: SA email needs **View financial data** + manage orders/subscriptions (Publisher API access alone is not always enough for RC receipt validation).

Do **not** invent alternate upload endpoints (`credentials_json`, multipart `/credentials`, etc.) — they 404 / 400 against API v2. Prefer opening the app settings URL and, if helpful, copying the local JSON to the clipboard (`pbcopy`) so the user only pastes + Saves.

### Google Cloud Pub/Sub API (RTDN)

RC dashboard error **"Google Cloud Pub/Sub API must first be enabled"** means the **same GCP project** as the SA JSON (`project_id` field) does not have `pubsub.googleapis.com` enabled.

| Automatable? | How |
| --- | --- |
| **Yes**, if the SA (or user) is **project Owner/Editor** with `serviceusage.services.enable` | Service Usage API / `gcloud services enable pubsub.googleapis.com` |
| **No**, with a narrow Play-only SA | `403 Permission denied to get/enable service` — ask user to grant Owner (or run as human Owner), then retry |

Also enable (RC checklist): `androidpublisher.googleapis.com`, `playdeveloperreporting.googleapis.com`, and often `cloudresourcemanager.googleapis.com` + `iam.googleapis.com` before IAM binds.

**When SA is Owner, agents should automate GCP side via the SA JSON** (`scripts/play-console/secrets/play-api-service-account.json`):

1. Enable `pubsub.googleapis.com` (+ related APIs above).  
2. Grant IAM on the SA: `roles/pubsub.editor` + `roles/monitoring.viewer`.  
3. Create (or reuse) a Pub/Sub topic, e.g. `projects/<PROJECT_ID>/topics/revenuecat-play-notifications`.  
4. On that topic, grant `roles/pubsub.publisher` to  
   `google-play-developer-notifications@system.gserviceaccount.com`  
   (required so Play can publish RTDN).  
5. Tell the user the **Topic ID** string to paste.

App-repo helper: `scripts/play-console/enable-rc-gcp-apis.sh` (`gcloud` as Owner) — same outcome as the Node Service Usage flow.

### What still needs humans (not RC/Play public APIs)

After Pub/Sub is enabled and the topic exists:

1. **RevenueCat dashboard** → Play app → Service credentials JSON uploaded (API cannot).  
2. **RevenueCat** → Connect to Google / pick topic (or use the topic we created if listed).  
3. **Play Console** → Monetize → **Monetization setup** → Real-time developer notifications → paste  
   `projects/<PROJECT_ID>/topics/<TOPIC>` → notification content: subscriptions + voided + one-time → Save → **Send test notification**.  
4. Confirm “Last received” on RC app settings.

There is **no** supported Android Publisher / RevenueCat public API to set the Play Monetization Setup RTDN topic for you — that paste is Console-only.

Console one-click enable (fallback):  
`https://console.cloud.google.com/apis/library/pubsub.googleapis.com?project=<PROJECT_ID>`

## Products

- Creating a product **registers** it in RC only — it does not create Play/ASC IAP
- **Not idempotent:** same `store_identifier` + app → conflict; always `list` first
- Play subscriptions: `store_identifier` = `productId:basePlanId`
- Play one-time: SKU string only
- Types commonly used: `subscription`, `consumable` (credits), sometimes `one_time`

## Entitlements & packages

- Entitlement `lookup_key` is what the app checks (`pro`)
- Packages group **equivalent** products across stores — attach one product per store
- Package id conventions: `$rc_monthly`, `$rc_annual`, `$rc_lifetime`, or custom

## Offerings

- Current offering is controlled in dashboard / targeting — creating `default` does not automatically make it current; verify after bootstrap
- Multiple offerings (`default`, `credits`) are normal for Voys apps

## Paywalls (summary)

- Draft PATCH requires current `revision`
- After publish, draft may be empty — next edit uses published revision
- Paywall AI Editor ignores custom PNG placement — use paywall-as-code
- Never publish without explicit user approval
- Component / lid traps: see [paywall-constraints.md](paywall-constraints.md)

## Webhooks

- Signing secret ≠ V2 API key
- Idempotent handling required in Supabase (event id)
- Product → credit amounts live in **app** webhook constants, not in this toolkit

## Rate limits / errors

- 401 → wrong/missing v2 key
- 403 → insufficient project permission
- 404 → wrong project / app / product id
- 409 / conflict → product or lookup_key already exists — treat as success-if-exists when bootstrapping
- 422 → body validation (wrong type, missing store_identifier, bad base plan format)
- 422 `Missing credentials for the store` → Play SA JSON not configured in **dashboard** (see Play Store app connection above)

## Do not

- Invent Data Safety / store prices inside RC
- Hardcode `sk_` in repo or Expo public env
- Retry `create-product` blindly on failure without listing
- Claim Play SA credentials were uploaded via API when they were not — hand off to dashboard
