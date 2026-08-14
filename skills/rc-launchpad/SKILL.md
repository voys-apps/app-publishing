---
name: rc-launchpad
description: >-
  Launchpad for RevenueCat end-to-end via REST API v2 and MCP: register
  products, entitlements, offerings, packages; build Hosted UI paywalls as code
  (custom PNGs, component trees, sticky footers, selected-state overrides,
  publish); Play RTDN (Pub/Sub) plus Supabase credits/entitlement webhooks
  (credits-bridge). Use when the user mentions RevenueCat, RC catalog,
  offerings, entitlements, packages, store SKU sync, Hosted UI paywall,
  paywall-as-code, rc-paywall-code, rc-api, rc-launchpad, rc-forge (legacy name),
  mockup-to-paywall, RTDN, revenuecat-webhook, credits grant, or API-first
  monetization. Prefer MCP for interactive catalog; Python templates for
  bootstrap + paywall scripts. Pair with play-launchpad for Play SKUs.
---

# RC Launchpad

One skill for the full RevenueCat surface: **catalog** (products → entitlement →
offerings → packages), **Hosted UI paywalls** (media → component tree →
publish), and **credits bridge** (Play RTDN + RC → Supabase webhook).

| Layer | Where |
| --- | --- |
| Play / ASC store products | [`play-launchpad`](../play-launchpad/SKILL.md) |
| RC catalog + paywalls + webhook/RTDN | **this skill** |
| Catalog scripts | `templates/revenuecat/` |
| Webhook stub | `templates/revenuecat-webhook/` + [credits-bridge.md](credits-bridge.md) |
| Paywall scripts | `scripts/revenuecat-paywall/` in the app (scaffold from [python-patterns.md](python-patterns.md)) |

**Install:**

```bash
npx skills add voys-apps/app-publishing --skill rc-launchpad
# or full toolkit:
npx skills add voys-apps/app-publishing -g
```

Legacy paywall-only repo (optional): `npx skills add voys-apps/rc-paywall-code`

## When to use which tool

| Need | Prefer |
| --- | --- |
| List / create products, entitlements, offerings, packages | **RevenueCat MCP** if connected; else `templates/revenuecat` |
| Attach products to entitlement / package | MCP `attach-products-to-*` or REST |
| Hosted UI from custom PNGs | REST + Python paywall scripts — **not** Paywall AI Editor |
| One-shot AI paywall mock (no custom art) | MCP `create-paywall-ai` only if user agrees |
| Publish / unpublish paywall | Explicit user ask → REST or MCP |
| Visual check | MCP `render-paywall-screenshot` or dashboard builder |
| Play RTDN / Pub/Sub + Supabase credits / `pro` sync | [credits-bridge.md](credits-bridge.md) + Edge Function |

Do **not** invent store products inside RC — create them in Play/ASC first (or
test store), then register `store_identifier`.

## Consult official API docs

Before writing or changing client code:

1. https://www.revenuecat.com/docs/api-v2  
2. Tags: App, Product, Entitlement, Offering, Package, Paywall, Media  
3. Webhooks: https://www.revenuecat.com/docs/integrations/webhooks  
4. Confirm paths, auth (`Bearer` V2 `sk_…`), body fields  
5. Apply [api-constraints.md](api-constraints.md), [catalog-patterns.md](catalog-patterns.md),  
   [paywall-constraints.md](paywall-constraints.md), [python-patterns.md](python-patterns.md),  
   [credits-bridge.md](credits-bridge.md)

If docs disagree with this skill, **prefer live docs**, then patch the skill.

## Credentials

| Variable | Required | Purpose |
| --- | --- | --- |
| `RC_API_KEY` | yes* | V2 secret — Project configuration Read & write |
| `RC_KEY_FILE` | alt* | File containing the secret |
| `RC_PROJECT_ID` | yes | `proj…` |
| `RC_APP_ID_IOS` / `RC_APP_ID_ANDROID` | product create | `app…` |
| `RC_PAYWALL_ID` | paywall work | `pw…` |
| `RC_ENV_FILE` | no | dotenv path |
| `REVENUECAT_WEBHOOK_SECRET` | webhook | Edge Function + RC Integrations header |

Never commit secrets. Never put V2 secrets in `EXPO_PUBLIC_*`. SDK keys
(`appl_` / `goog_`) are client-safe and separate.

---

## Part A — Catalog forge

```
Task Progress:
- [ ] 1. Stores: Play + ASC products exist (shared reverse-DNS ids when possible)
- [ ] 2. RC apps exist — note app ids
- [ ] 2b. Play SA is GCP project **Owner** (required for agents to enable APIs / Pub/Sub / IAM)
- [ ] 2c. Play app: user uploads SA JSON in RC dashboard (API cannot — see api-constraints)
- [ ] 3. Create/list products (`store_identifier` + type)
- [ ] 4. Entitlement `pro` + attach subscription products
- [ ] 5. Offering `default` + packages ($rc_monthly, $rc_annual, …)
- [ ] 6. Offering `credits` + consumable packages (optional)
- [ ] 7. Attach iOS + Android products to each package
- [ ] 8. Paywall (Part B) — publish only on ask
- [ ] 9. Credits bridge (Part C) — RTDN + webhook + product → credits map
```

### Play Store credentials (manual + Owner IAM)

**Convention:** the Play Publisher SA JSON (`scripts/play-console/secrets/play-api-service-account.json`) must be a **GCP project Owner** on the Cloud project in that JSON (`project_id`). Agents then use **all** automatable permissions: Service Usage (enable APIs), IAM binds, Pub/Sub topic + RTDN publisher grant. A narrow Play-only SA gets `403` on those calls — do not invent workarounds; ask the user to grant **Owner**, then retry.

After `create-app` (`play_store` + `package_name`), **stop and hand off** for SA JSON upload (API cannot):

**Agent opens / prepares; user clicks:**

1. `open` RevenueCat Play app settings (Service credentials)  
2. Optionally `pbcopy < scripts/play-console/secrets/play-api-service-account.json`  
3. User: paste/upload JSON → **Save**  
4. Verify later with store-state / MCP — never claim upload succeeded without confirmation  

Same pattern for RTDN topic paste in Play Monetization setup (see firebase-launchpad [handoffs.md](../firebase-launchpad/handoffs.md)).

- Dashboard: Project → Play app → **Service credentials (Google Play)** → paste/upload JSON → Save  
- Local file often at `scripts/play-console/secrets/play-api-service-account.json`  
- Errors like “Connection issue” / “Service Account Credentials JSON” / store-state **Missing credentials for the store** mean this step is incomplete — **not** a product-ID bug  

Details: [api-constraints.md](api-constraints.md) § Play Store app connection.

### Play `store_identifier`

| Type | Format |
| --- | --- |
| Subscription | `productId:basePlanId` |
| One-time / consumable | SKU only |

### Voys conventions

```text
com.<company>.<app>.pro.monthly | .pro.yearly
com.<company>.<app>.credits10k | credits25k | …
```

- Entitlement: `pro`  
- Offerings: `default`, `credits`  
- Packages: `$rc_monthly`, `$rc_annual`, custom for packs  

### MCP map (catalog)

| Tool | Use |
| --- | --- |
| `list-apps` / `list-products` / `list-entitlements` / `list-offerings` / `list-packages` | Discover first |
| `create-product` | Not idempotent — list before create |
| `create-entitlement` / `attach-products-to-entitlement` | `pro` gate |
| `create-offering` / `create-packages` / `attach-products-to-package` | Wire catalog |
| `list-paywalls` / `get-paywall` / `publish-paywall` | Paywall ops |

Always `GetMcpTools` for schema before `CallMcpTool`.

### Catalog template

```bash
cp -R templates/revenuecat your-app/scripts/revenuecat
# edit catalog.py
python3 list_catalog.py
python3 bootstrap_catalog.py --dry-run
python3 bootstrap_catalog.py
```

Details: [catalog-patterns.md](catalog-patterns.md).

---

## Part B — Paywall forge

Build Hosted UI by uploading assets and PATCHing component JSON with **Python**.
If the repo already has `scripts/revenuecat-paywall/`, **edit those** — do not
reinvent the DSL. Scaffold Node only if the user explicitly asks.

```
Task Progress:
- [ ] 1. Auth + offering / paywall ids
- [ ] 2. Upload (or reuse) media → manifest (resize + WebP first)
- [ ] 3. Build component tree + localizations
- [ ] 4. PATCH draft (read revision first)
- [ ] 5. Screenshot / device preview; iterate
- [ ] 6. Publish only when the user explicitly asks
```

### Media (required discipline)

1. Resize ~**3×** on-screen pt width before upload  
2. Re-encode UI art to **WebP** (`quality≈75`)  
3. Full-bleed backgrounds ~2–2.5× phone res — no multi‑MB raw PNGs  
4. Keep local manifest `key → urls/dimensions`  

Hard limit ~2.8M base64 chars. Recipe: [python-patterns.md](python-patterns.md).

### Layout rules (high signal)

- Sticky CTA: `sticky_footer` with inner `type: "footer"`. On Android **9.x** do **not** set root `overflow: "scroll"` or `height: "fill"` — RC already wraps the root in `verticalScroll` (nested scroll crash). Root `height: "fit"`, no `scroll=`.  
- **Never** negative `padding` / `margin` on image **or** stack (Android `Top padding must be non-negative`). Overlap with `zlayer`, not `margin.top: -20`.  
- Package chrome: base = unselected; selected look via `overrides` + `conditions: [{ "type": "selected" }]`  
- Prices: `{{ product.price_per_period }}` etc. — never hardcode  
- Flat `purchase_button` — do not use cropped CTA PNG plates  
- `text_lid` / `url_lid` = **exactly 10 characters**  

Full traps: [paywall-constraints.md](paywall-constraints.md).

### Paywall modules

| File | Role |
| --- | --- |
| `rc_api.py` | Auth, media, GET/PATCH, publish |
| `components.py` | DSL helpers |
| `upload_assets.py` | Resize + WebP → manifest |
| `build_paywall.py` | Layout → `save_draft` |
| `publish_paywall.py` | `actions/publish` (user ask only) |

```bash
PYTHONPATH=scripts/revenuecat-paywall python3 scripts/revenuecat-paywall/upload_assets.py <assets> /tmp/assets.json
PYTHONPATH=scripts/revenuecat-paywall python3 scripts/revenuecat-paywall/build_paywall.py /tmp/assets.json
# only on explicit ask:
PYTHONPATH=scripts/revenuecat-paywall python3 scripts/revenuecat-paywall/publish_paywall.py
```

---

## Part C — Credits bridge (RTDN + webhook)

Wire store notifications into RC, then RC events into Supabase credits / `pro`.

Full contract: **[credits-bridge.md](credits-bridge.md)**.

```bash
# New app:
cp -R templates/revenuecat-webhook your-app/supabase/functions/revenuecat-webhook
# Edit CREDIT_PRODUCTS + deploy; set REVENUECAT_WEBHOOK_SECRET
```

Do **not** split this into a separate skill — keep monetization glue here.

---

## Hard rules

1. Store products before RC registration (except test store)  
2. `create-product` is not idempotent — list first  
3. Play subs need `productId:basePlanId`  
4. Never publish a paywall without an explicit ask  
5. No V2 secrets in git or `EXPO_PUBLIC_*`  
6. Custom PNGs → code path, not Paywall AI Editor  
7. Prefer MCP for interactive catalog; templates for repeatable bootstraps  
8. **Never pretend Play SA credentials were set via API** — open app settings + optional `pbcopy`; **user** pastes + Saves (see [../firebase-launchpad/handoffs.md](../firebase-launchpad/handoffs.md))  
9. **Play SA must be GCP project Owner** — agents assume Owner so they can enable APIs, set IAM, and provision Pub/Sub/RTDN; if not Owner, stop and ask the user to grant it  
10. Webhook grants must be **idempotent**; credit map lives in app constants  
11. **Android Hosted UI 9.x:** no negative padding/margin anywhere; root stack `height: "fit"` and **no** `overflow: "scroll"` — see [paywall-constraints.md](paywall-constraints.md) § Android SDK crashes  

## Additional resources

- [api-constraints.md](api-constraints.md) — catalog + shared API traps  
- [catalog-patterns.md](catalog-patterns.md) — REST paths + bootstrap shape  
- [paywall-constraints.md](paywall-constraints.md) — 400/422 **and Android render crashes**  
- [python-patterns.md](python-patterns.md) — paywall script recipes  
- [credits-bridge.md](credits-bridge.md) — RTDN + Supabase webhook / credits  
