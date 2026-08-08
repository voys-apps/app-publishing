# RevenueCat API templates

Python scripts for **API v2** catalog bootstrap (products, entitlements, offerings,
packages). Hosted UI paywalls: skill **rc-launchpad** /
`scripts/revenuecat-paywall/` in the app.

## Setup

```bash
cp -R templates/revenuecat your-app/scripts/revenuecat
cd your-app/scripts/revenuecat
# edit catalog.py — PROJECT apps + product store_identifiers
export RC_API_KEY=sk_...
export RC_PROJECT_ID=proj...
python3 list_catalog.py
python3 bootstrap_catalog.py --dry-run
python3 bootstrap_catalog.py
```

Create Play / App Store products **before** bootstrap. Play subscriptions use
`productId:basePlanId`.

## Skill

- `rc-launchpad` — catalog + Hosted UI paywalls (MCP/REST + Python)
