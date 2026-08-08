# Catalog patterns (REST + Python)

Base: `https://api.revenuecat.com/v2`  
Auth: `Authorization: Bearer {RC_API_KEY}`

## Endpoints (verify against live docs before coding)

```text
GET    /projects/{project_id}/apps
GET    /projects/{project_id}/products
POST   /projects/{project_id}/products
GET    /projects/{project_id}/entitlements
POST   /projects/{project_id}/entitlements
POST   /projects/{project_id}/entitlements/{entitlement_id}/actions/attach_products
GET    /projects/{project_id}/offerings
POST   /projects/{project_id}/offerings
POST   /projects/{project_id}/offerings/{offering_id}/packages
POST   /projects/{project_id}/packages/{package_id}/actions/attach_products
GET    /projects/{project_id}/paywalls
GET    /projects/{project_id}/paywalls/{paywall_id}?expand=components
PATCH  /projects/{project_id}/paywalls/{paywall_id}
POST   /projects/{project_id}/paywalls/{paywall_id}/actions/publish
```

Exact path suffixes for attach actions can vary by API version — **confirm in
docs or MCP tool schemas** before shipping scripts. Prefer MCP tool names when
mutating interactively.

## Template layout (`templates/revenuecat/`)

| File | Role |
| --- | --- |
| `rc_client.py` | Auth, dotenv, `request()`, `require_config()` |
| `catalog.py` | Placeholder project/app ids + product/offering rows |
| `list_catalog.py` | Print apps, products, entitlements, offerings |
| `bootstrap_catalog.py` | Create missing products / entitlement / offerings / packages (`--dry-run`) |

Paywall UI scripts stay in `scripts/revenuecat-paywall/` (see **rc-launchpad**
python-patterns / paywall-constraints).

## `catalog.py` shape

```python
PROJECT_ID = "proj_example"

APPS = {
    "app_store": "app_ios_example",
    "play_store": "app_android_example",
}

ENTITLEMENT_LOOKUP = "pro"

# RC product type + per-store store_identifier
PRODUCTS = [
    {
        "key": "pro_monthly",
        "type": "subscription",
        "display_name": "Monthly Pro",
        "stores": {
            # Play: productId:basePlanId
            "play_store": "com.example.app.pro.monthly:monthly",
            "app_store": "com.example.app.pro.monthly",
        },
    },
    {
        "key": "credits_10k",
        "type": "consumable",
        "display_name": "10K Credits",
        "stores": {
            "play_store": "com.example.app.credits10k",
            "app_store": "com.example.app.credits10k",
        },
    },
]

OFFERINGS = [
    {
        "lookup_key": "default",
        "display_name": "Default",
        "packages": [
            {"lookup_key": "$rc_monthly", "product_key": "pro_monthly"},
            {"lookup_key": "$rc_annual", "product_key": "pro_yearly"},
        ],
    },
    {
        "lookup_key": "credits",
        "display_name": "Credits",
        "packages": [
            {"lookup_key": "credits_10k", "product_key": "credits_10k"},
        ],
    },
]
```

## Bootstrap algorithm

1. `GET` products / entitlements / offerings (paginate if needed)  
2. For each catalog product × store: if no matching `store_identifier`, `POST` product  
3. Ensure entitlement `pro`; attach subscription product ids  
4. Ensure offerings; create packages; attach iOS+Android products to each package  
5. Print ids for paywall / webhook wiring  
6. Stop before paywall publish unless user asks → continue with **rc-launchpad** paywall scripts

## Idempotency

- Treat “already exists” / conflict as OK when lookup_key or store_identifier matches  
- Never delete entitlements or offerings from bootstrap scripts  
- `--dry-run` must print planned POSTs without calling them

## MCP vs script

| Situation | Choice |
| --- | --- |
| Exploring one project in chat | MCP list/create/attach |
| New app repo needs repeatable setup | Copy `templates/revenuecat` + edit `catalog.py` |
| Pixel paywall from PNGs | **rc-launchpad** Python paywall modules |
