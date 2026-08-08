# Firebase Launchpad — examples

## Example A — Full provision + EAS FCM

User: “Firebase yok, json koy, analytics, push key’i EAS’a yükle”

1. Owner SA; `pnpm provision` + `configs:download`
2. `analytics:status` → if 404, give Integrations URL
3. Set `EAS_ACCOUNT_NAME` from `expo.owner`, `EAS_PROJECT_SLUG` from slug
4. `eas login` or `EXPO_TOKEN` → `pnpm eas:upload-fcm`
5. Confirm dashboard credentials show new `projectIdentifier`

## Example B — Replace dead Firebase project on EAS

User: “Eski quickdoc-13e77 yok / push çalışmıyor”

1. Provision on live GCP; overwrite `config/firebase/*`
2. `eas:upload-fcm` — replaces previous FCM V1 key on Android app credentials
3. Rebuild native app so client config matches

## Example C — EXPERIENCE_NOT_FOUND

User / script used `@appsvoys/quickdoc` but app is `@appsvoyss-organization/quickdoc`

→ Fix catalog `EAS_ACCOUNT_NAME` to `app.json` `owner`. List `me.accounts`.

## Example D — Interactive eas credentials

User: “eas credentials ile yükle”

→ Prefer GraphQL script. Explain CLI is interactive-only for GSAK / FCM V1.
Dashboard upload is fallback: expo.dev → project → Credentials → FCM V1.

## Example E — Analytics only blocked

User: “Analytics enable değil” / screenshot with Enable button

1. Do **not** claim API can finish first-time ToS.
2. Open handoff pages: `pnpm console:open` (or `open` Integrations + Analytics overview).
3. Tell user exact clicks: Enable → ToS → property.
4. After they confirm, `pnpm analytics:status`.
5. Continue EAS FCM in parallel if not done.

## Example F — iOS push

User: “APNs”

→ `pnpm console:open -- --only=cloudMessaging`. User uploads `.p8`.
Keep Android FCM on EAS automated.