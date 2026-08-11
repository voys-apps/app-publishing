# APC Launchpad — API constraints

## Auth / JWT

| Symptom | Cause | Fix |
| --- | --- | --- |
| `401` / `NOT_AUTHORIZED` | Bad Issuer, Key ID, or `.p8` | Regenerate key; confirm `ASC_ISSUER_ID` + `ASC_KEY_ID` match the downloaded key |
| `403` on apps | Key role too weak or app not in team | Use **Admin** or **App Manager**; confirm provider/team |
| JWT rejected | Wrong `aud` or expired token | `aud` must be `appstoreconnect-v1`; tokens ~20 min max |

JWT header/payload (ES256):

```json
{ "alg": "ES256", "kid": "<ASC_KEY_ID>", "typ": "JWT" }
{ "iss": "<ASC_ISSUER_ID>", "iat": <unix>, "exp": <iat+1200>, "aud": "appstoreconnect-v1" }
```

Sign with the `.p8` private key. Base URL: `https://api.appstoreconnect.apple.com`.

## Bundle IDs & app create

| Action | Endpoint | Result |
| --- | --- | --- |
| Create bundle | `POST /v1/bundleIds` | `platform`: `IOS` \| `MAC_OS` \| `UNIVERSAL` only — **not** `SERVICES` |
| List apps | `GET /v1/apps` | Scoped to the API key’s team |
| Create app | `POST /v1/apps` | **403** — resource does not allow CREATE → Console New App |

After Console create: `pnpm app:resolve` → persist `ASC_APP_APPLE_ID`.

## IAP

| Action | Endpoint |
| --- | --- |
| Subscription group | `POST /v1/subscriptionGroups` |
| Subscription | `POST /v1/subscriptions` |
| Subscription localization | `POST /v1/subscriptionLocalizations` |
| Consumable create | `POST /v2/inAppPurchases` (`/v1/inAppPurchases` CREATE forbidden) |
| Consumable localization | `POST /v1/inAppPurchaseLocalizations` |

Pricing and “Ready to Submit” remain Console handoffs. Paid Apps agreement must be active.

## Review detail

`POST /v1/appStoreReviewDetails` requires `contactPhone` like `+90 532 000 0000` (plus country code + spaces).

## App resolve

| Approach | Endpoint |
| --- | --- |
| By bundle ID | `GET /v1/apps?filter[bundleId]=com.example.app` |
| By numeric Apple ID | `GET /v1/apps/{id}` — `id` is the ASC resource id (often the same numeric Apple ID string) |

Mismatch between Transporter’s relationship ID and ASC App Information Apple ID
→ upload `409 ENTITY_ERROR.RELATIONSHIP.INVALID` (`'NNNN' is not a valid ID for
this relationship`). Usually **not** a bad IPA: wrong provider, deleted/recreated
app record, pending agreements, or stale Transporter mapping. Verify
`pnpm app:resolve` against App Information → Apple ID.

## Versions

| Filter | Notes |
| --- | --- |
| `filter[platform]=IOS` | Always scope iOS |
| `filter[versionString]=1.3.1` | Target marketing version |
| Prefer editable states | e.g. `PREPARE_FOR_SUBMISSION`, `DEVELOPER_REJECTED`, `REJECTED` when updating what’s new |

List: `GET /v1/apps/{id}/appStoreVersions?filter[platform]=IOS`

If no editable version exists, tell the user to create version **X.Y.Z** in ASC
(or via API create version — not in v1 template).

## Version localizations

| Method | Path |
| --- | --- |
| List | `GET /v1/appStoreVersions/{id}/appStoreVersionLocalizations` |
| Create | `POST /v1/appStoreVersionLocalizations` (+ relationship to version) |
| Patch | `PATCH /v1/appStoreVersionLocalizations/{id}` |

Attributes (partial PATCH preserves omitted fields):

- `whatsNew`
- `promotionalText`
- `description`
- `keywords`
- `supportUrl`
- `marketingUrl`
- `locale` (create only)

### Limits (Unicode code points)

| Field | Max |
| --- | --- |
| `promotionalText` | 170 |
| `whatsNew` | 4000 |
| `description` | 4000 |
| `keywords` | 100 |

`promotionalText` is often editable even when the app is live; `whatsNew` /
`description` usually need an editable version state.

## Locales (common Voys set)

Use ASC locale identifiers exactly:

| Locale | Notes |
| --- | --- |
| `en-US` | Primary English |
| `tr` | Turkish |
| `es-ES` | Spanish (Spain) |
| `de-DE` | German |
| `fr-FR` | French |
| `zh-Hant` | Chinese Traditional |
| `ar-SA` | Arabic |

Do not invent codes like `tr-TR` unless ASC lists them for that app. Prefer
listing existing localizations first, then create missing ones only when the
user wants that language added.

## App Review detail

| Method | Path |
| --- | --- |
| Get | `GET /v1/appStoreVersions/{id}/appStoreReviewDetail` |
| Patch | `PATCH /v1/appStoreReviewDetails/{id}` |

Useful attributes: `notes`, `demoAccountName`, `demoAccountPassword`,
`demoAccountRequired`, contact fields.

Never commit real demo passwords; keep in local catalog / env.

## Rate limits / errors

- ASC returns JSON:API errors with `status`, `code`, `title`, `detail`.
- On `409` relationship invalid during **binary** upload: check app ID + agreements,
  not version string format first (still avoid non-numeric build quirks).
- Retry transient `429` / `5xx` with backoff; do not hammer list endpoints.

## Out of scope (v1)

- Screenshot / preview set upload
- IAP / subscription catalog (use RevenueCat + store; ASC IAP later)
- IPA upload via API (use `eas submit` / Transporter)
- App Info localizations (`name` / `subtitle`) — future extension on
  `appInfoLocalizations`
