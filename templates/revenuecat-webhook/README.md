# RevenueCat → Supabase webhook stub

Copy into an app:

```bash
cp -R templates/revenuecat-webhook <app>/supabase/functions/revenuecat-webhook
```

Then:

1. Fill `CREDIT_PRODUCTS` with your Play/ASC product ids.  
2. Align entitlement markers with RC (`pro`).  
3. Deploy the Edge Function; set `REVENUECAT_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.  
4. Register the URL in RevenueCat → Integrations → Webhooks.  

Contract and RTDN notes: `skills/rc-launchpad/credits-bridge.md`.

This stub is intentionally thin — prefer copying a battle-tested app function
(e.g. QuickDoc `supabase/functions/revenuecat-webhook/`) when one exists, then
strip app-specific ids.
