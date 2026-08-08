# Credits bridge — RC webhooks → Supabase

**RTDN** (Play → Pub/Sub → RevenueCat) keeps RC’s receipt state fresh.  
**Server webhook** (RevenueCat → your backend) updates **credits / plan** in Supabase.

This skill owns both ends of that monetization glue. Do **not** invent a separate
`rc-webhook` skill — extend these notes + app `supabase/functions/revenuecat-webhook/`.

## Two pipes (don’t confuse)

| Pipe | Direction | Purpose | Agent automatable? |
| --- | --- | --- | --- |
| **RTDN** | Play → GCP Pub/Sub → RC | Store notifications into RC | GCP topic/IAM **yes** (Owner SA); Play Console topic paste **no** |
| **RC webhook** | RC → HTTPS Edge Function | Grant credits / set `pro` / expire | Deploy + secrets in app; RC dashboard URL + auth header is handoff |

RTDN details (Pub/Sub enable, topic, publisher SA): [api-constraints.md](api-constraints.md) § Google Cloud Pub/Sub API (RTDN).  
Handoffs: [../firebase-launchpad/handoffs.md](../firebase-launchpad/handoffs.md).

## Voys webhook contract (Supabase Edge)

Canonical shape (QuickDoc / Voys apps):

```text
supabase/functions/revenuecat-webhook/
  index.ts          # POST handler
  constants.ts      # CREDIT_PRODUCTS map, PRO_MONTHLY_CREDITS, entitlement markers
  service.ts        # grant_credits RPC + service role client
  utils.ts          # auth, event filter, account update
  types.ts
  rc-identifiers.ts # entitlement id → plan
```

Toolkit stub (copy into new apps): `templates/revenuecat-webhook/` in app-publishing.

### Auth

- Env: `REVENUECAT_WEBHOOK_SECRET`
- Header: `Authorization: Bearer <same secret>`
- Reject if secret missing or mismatch → `401`
- Also need `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` on the function

### `app_user_id`

- Must be Supabase Auth user UUID (same id RC `Purchases.logIn` / `appUserID`)
- Invalid UUID → `400`; unknown account → log warn, still `200` when safe (avoid RC retry storms)

### Events to care about

| Event | Typical action |
| --- | --- |
| `INITIAL_PURCHASE` / `RENEWAL` / `UNCANCELLATION` / `PRODUCT_CHANGE` | Set plan from entitlements; renewals may grant monthly credits |
| `CANCELLATION` | Keep plan until expiration unless product rules say otherwise |
| `EXPIRATION` | Downgrade to free; clear expire date |
| `NON_RENEWING_PURCHASE` | Credit packs: often handled by **client** or separate grant path — **do not** double-grant if credits are applied elsewhere |
| `BILLING_ISSUE` / `TEMPORARY_ENTITLEMENT_GRANT` | App-specific; default = update plan flags carefully |

Skip unknown / noise types with `{ success: true, skipped: true }`.

### Credits

1. **Consumable packs** — map `product_id` → amount in `CREDIT_PRODUCTS` (store reverse-DNS ids + any legacy test ids).  
2. **Pro monthly grant** — on renewal-like events, `rpc('grant_credits', …)` with fixed `PRO_MONTHLY_CREDITS`.  
3. **Idempotency** — key from `event.id` or `transaction_id` (e.g. `pro_monthly_renewal:<id>`). Never grant twice for the same key.  
4. Credit products must **not** be attached to entitlement `pro`.

### Entitlement → plan

- Marker: `pro` (and aliases in `PRO_ENTITLEMENT_MARKERS`)  
- Write `accounts.subscription_type` + `subscription_expire_date` from `expiration_at_ms`  
- Priority list if multiple paid plans exist later (`PAID_PLAN_PRIORITY`)

### RC dashboard handoff (user clicks)

1. Project → Integrations → Webhooks → add URL:  
   `https://<project-ref>.supabase.co/functions/v1/revenuecat-webhook`  
2. Authorization header / shared secret = `REVENUECAT_WEBHOOK_SECRET`  
3. Send test event; confirm Edge logs + `accounts` / credit ledger row  

Agent may open the Integrations URL; **user** saves the webhook.

### Agent checklist

```
Task Progress:
- [ ] 1. RTDN: Owner SA → Pub/Sub API + topic + Play publisher bind ([api-constraints.md](api-constraints.md))
- [ ] 2. User pastes topic in Play Monetization setup + RC Connect (handoff)
- [ ] 3. Edge function exists (scaffold from template or app copy)
- [ ] 4. `CREDIT_PRODUCTS` matches Play/ASC/RC store identifiers
- [ ] 5. Secrets on function: webhook secret + service role
- [ ] 6. User registers webhook URL in RC
- [ ] 7. Sandbox purchase → plan/credits verified
```

### Hard rules

1. Product → credit amounts live in the **app** (or template constants), not RC catalog metadata alone.  
2. Never put webhook / service-role secrets in `EXPO_PUBLIC_*` or git.  
3. Prefer idempotent RPCs over blind `UPDATE accounts SET credits = credits + n`.  
4. Do not claim RTDN or webhook “works” without a test event / purchase confirmation.  
5. Play SA must be GCP **Owner** for Pub/Sub automation — same rule as catalog RTDN setup.
