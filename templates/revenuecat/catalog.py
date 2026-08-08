"""
Per-app RevenueCat catalog — edit these placeholders before bootstrap.

Set RC_PROJECT_ID in env (preferred) or override PROJECT_ID below.
App ids: RevenueCat dashboard → Project → Apps (app…).
"""

# Optional fallback if RC_PROJECT_ID unset
PROJECT_ID = "proj_example"

APPS = {
    # store key → RevenueCat app id
    "app_store": "app_ios_example",
    "play_store": "app_android_example",
}

ENTITLEMENT = {
    "lookup_key": "pro",
    "display_name": "Pro",
}

# Products to register in RC (stores must already have these SKUs).
PRODUCTS = [
    {
        "key": "pro_monthly",
        "type": "subscription",
        "display_name": "Monthly Pro",
        "attach_to_entitlement": True,
        "stores": {
            "play_store": "com.example.yourapp.pro.monthly:monthly",
            "app_store": "com.example.yourapp.pro.monthly",
        },
    },
    {
        "key": "pro_yearly",
        "type": "subscription",
        "display_name": "Yearly Pro",
        "attach_to_entitlement": True,
        "stores": {
            "play_store": "com.example.yourapp.pro.yearly:yearly",
            "app_store": "com.example.yourapp.pro.yearly",
        },
    },
    {
        "key": "credits_10k",
        "type": "consumable",
        "display_name": "10K Credits",
        "attach_to_entitlement": False,
        "stores": {
            "play_store": "com.example.yourapp.credits10k",
            "app_store": "com.example.yourapp.credits10k",
        },
    },
]

OFFERINGS = [
    {
        "lookup_key": "default",
        "display_name": "Default",
        "packages": [
            {
                "lookup_key": "$rc_monthly",
                "display_name": "Monthly",
                "product_key": "pro_monthly",
            },
            {
                "lookup_key": "$rc_annual",
                "display_name": "Yearly",
                "product_key": "pro_yearly",
            },
        ],
    },
    {
        "lookup_key": "credits",
        "display_name": "Credits",
        "packages": [
            {
                "lookup_key": "credits_10k",
                "display_name": "10K Credits",
                "product_key": "credits_10k",
            },
        ],
    },
]
