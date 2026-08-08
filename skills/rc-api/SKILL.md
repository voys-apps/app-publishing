---
name: rc-api
description: >-
  Configure RevenueCat via REST API v2 and MCP: apps, products, entitlements,
  offerings, packages, product attachments, and Hosted UI paywalls. Use when
  bootstrapping a new app’s RC catalog, aligning store SKUs with Play/ASC,
  creating offerings (default/credits), attaching products to pro entitlement,
  listing/updating products, or when the user mentions RevenueCat API, RC
  catalog, offerings, entitlements, packages, or wants API-first monetization
  setup (not only paywall UI). Prefer MCP for catalog mutations when available;
  use Python templates for repeatable scripts and paywall-as-code.
---

# RevenueCat API (catalog + paywalls)

API-first RevenueCat setup for Voys Expo apps. **Stores own the SKUs** (Play /
App Store); RevenueCat **registers** them, groups packages, gates entitlements,
and serves Hosted UI paywalls.

| Layer | Skill / template |
| --- | --- |
| Catalog (products → entitlement → offering → packages) | **this skill** + `templates/revenuecat/` |
| Hosted UI layout (PNG → component tree → publish) | [`rc-paywall-code`](../rc-paywall-code/SKILL.md) |
| Play store SKUs | [`play-launchpad`](../play-launchpad/SKILL.md) |

**Install:**

```bash
npx skills add voys-apps/app-publishing --skill rc-api
# or full toolkit:
npx skills add voys-apps/app-publishing -g
```

## When to use which tool

| Need | Prefer |
| --- | --- |
| List / create products, entitlements, offerings, packages | **RevenueCat MCP** if connected; else Python `templates/revenuecat` |
| Attach products to entitlement / package | MCP `attach-products-to-*` or REST |
| Hosted UI from custom art | REST + Python → **rc-paywall-code** (not Paywall AI Editor) |
| One-shot AI paywall mock | MCP `create-paywall-ai` only if user has **no** custom PNGs |
| Publish paywall | Explicit user ask → REST `actions/publish` or MCP `publish-paywall` |
| Customer grant / charts | MCP when needed; not part of app bootstrap |

Do **not** invent store products inside RC — create them in Play/ASC first (or
test store), then register `store_identifier` in RC.

## Consult official API docs

Before writing or changing client code:

1. https://www.revenuecat.com/docs/api-v2  
2. Tags: Product, Entitlement, Offering, Package, Paywall, App  
3. Confirm paths, auth (`Bearer` V2 secret `sk_…`), and body fields  
4. Apply [api-constraints.md](api-constraints.md) and [catalog-patterns.md](catalog-patterns.md)

If docs disagree with this skill, **prefer live docs**, then patch the skill.

## Credentials

| Variable | Required | Purpose |
| --- | --- | --- |
| `RC_API_KEY` | yes* | V2 secret — Project configuration Read & write |
| `RC_KEY_FILE` | alt* | File containing the secret |
| `RC_PROJECT_ID` | yes | `proj…` |
| `RC_APP_ID_IOS` / `RC_APP_ID_ANDROID` | for product create | `app…` ids from RC |
| `RC_PAYWALL_ID` | paywall only | `pw…` |
| `RC_ENV_FILE` | no | dotenv path |

Never commit secrets. SDK public keys (`appl_` / `goog_`) are separate (client).

## Canonical bootstrap order

```
Task Progress:
- [ ] 1. Stores: Play + ASC products exist (same reverse-DNS ids when possible)
- [ ] 2. RC apps exist (iOS + Android) — note app ids
- [ ] 3. Create/list products in RC (store_identifier + type)
- [ ] 4. Entitlement `pro` + attach subscription products
- [ ] 5. Offering `default` + packages ($rc_monthly, $rc_annual, …)
- [ ] 6. Offering `credits` + packages for consumable packs (optional)
- [ ] 7. Attach store products to packages (one product per store per package)
- [ ] 8. Paywall on offering (rc-paywall-code) — publish only on ask
- [ ] 9. Webhook → Supabase (app repo) — product → credits map
```

### Google Play `store_identifier` rules

| Type | Format |
| --- | --- |
| Subscription | `productId:basePlanId` (e.g. `com.app.pro.monthly:monthly`) |
| One-time / consumable | SKU only (e.g. `com.app.credits10k`) |

App Store: use the ASC product id string as-is.

## Product ID conventions (Voys)

```text
com.<company>.<app>.pro.monthly
com.<company>.<app>.pro.yearly
com.<company>.<app>.credits10k | credits25k | …
```

- Entitlement lookup_key: `pro`  
- Offerings: `default` (subs), `credits` (packs)  
- Packages: `$rc_monthly`, `$rc_annual`, custom for credits (`credits_10k`, …)

Edit per-app data only in `catalog.py` / app constants — keep client code generic.

## MCP quick map

| MCP tool | Use |
| --- | --- |
| `list-apps` / `list-products` / `list-entitlements` / `list-offerings` / `list-packages` | Discover before create |
| `create-product` | Register store SKU (not idempotent — conflict on retry) |
| `create-entitlement` | `lookup_key` = identifier (`pro`) |
| `attach-products-to-entitlement` | Subs → `pro` |
| `create-offering` | `default` / `credits` |
| `create-packages` | Under an offering |
| `attach-products-to-package` | One iOS + one Android product typical |
| `list-paywalls` / `get-paywall` / `render-paywall-screenshot` | Inspect UI |
| `publish-paywall` / `unpublish-paywall` | Only on explicit user ask |

Always call `GetMcpTools` for the tool schema before `CallMcpTool`.

## Python template

Copy into an app:

```bash
cp -R templates/revenuecat your-app/scripts/revenuecat
cd your-app/scripts/revenuecat
# edit catalog.py — project/app ids, product rows
python3 list_catalog.py
python3 bootstrap_catalog.py --dry-run
python3 bootstrap_catalog.py
```

See [catalog-patterns.md](catalog-patterns.md) for REST paths and script shape.
Paywall modules stay under `scripts/revenuecat-paywall/` per **rc-paywall-code**.

## Hard rules

1. Create store products **before** RC registration (except test store).  
2. `create-product` is **not** idempotent — list first; skip if exists.  
3. Play subscriptions need `productId:basePlanId`.  
4. Do not publish paywalls without an explicit ask.  
5. Do not put V2 secrets in `EXPO_PUBLIC_*`.  
6. Prefer MCP for interactive catalog work; prefer templates for repeatable app bootstraps.

## Additional resources

- [api-constraints.md](api-constraints.md)  
- [catalog-patterns.md](catalog-patterns.md)  
- Paywall layout: [../rc-paywall-code/SKILL.md](../rc-paywall-code/SKILL.md)
