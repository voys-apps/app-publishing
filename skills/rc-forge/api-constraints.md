# RevenueCat API constraints (catalog + shared)

## Auth

- Header: `Authorization: Bearer sk_…` (API **v2** secret)
- Scope: Project configuration Read & write for catalog + paywall mutations
- Public SDK keys (`appl_` / `goog_`) cannot call these endpoints

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

## Do not

- Invent Data Safety / store prices inside RC
- Hardcode `sk_` in repo or Expo public env
- Retry `create-product` blindly on failure without listing
