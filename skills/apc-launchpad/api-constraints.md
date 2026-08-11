# APC Launchpad — API constraints

## Auth / JWT

| Symptom | Cause | Fix |
| --- | --- | --- |
| `401` / `NOT_AUTHORIZED` | Bad Issuer, Key ID, or `.p8` | Regenerate key; confirm `ASC_ISSUER_ID` + `ASC_KEY_ID` |
| `403` on apps | Weak role / wrong team | Admin or App Manager; correct provider |
| JWT rejected | Wrong `aud` or expired | `aud` must be `appstoreconnect-v1`; ~20 min |

```json
{ "alg": "ES256", "kid": "<ASC_KEY_ID>", "typ": "JWT" }
{ "iss": "<ASC_ISSUER_ID>", "iat": <unix>, "exp": <iat+1200>, "aud": "appstoreconnect-v1" }
```

Base URL: `https://api.appstoreconnect.apple.com`.

## Bundle IDs & app create

| Action | Endpoint | Result |
| --- | --- | --- |
| Create bundle | `POST /v1/bundleIds` | `IOS` \| `MAC_OS` \| `UNIVERSAL` — **not** `SERVICES` |
| List apps | `GET /v1/apps` | Scoped to key’s team |
| Create app | `POST /v1/apps` | **403** → Console New App |

Then `pnpm app:resolve` → `ASC_APP_APPLE_ID`.

## App Information forms

See [review-forms.md](review-forms.md).

| Action | Endpoint |
| --- | --- |
| Content rights | `PATCH /v1/apps/{id}` `contentRightsDeclaration` |
| Category | `PATCH /v1/appInfos/{id}` relationships `primaryCategory` / `secondaryCategory` |
| Age rating | `PATCH /v1/ageRatingDeclarations/{id}` (GET_INSTANCE often 403) |
| Privacy Policy URL | `PATCH /v1/appInfoLocalizations/{id}` `privacyPolicyUrl` |
| Subtitle / name | `PATCH /v1/appInfoLocalizations/{id}` `subtitle` (≤30), `name` |
| Free / paid app price | `POST /v1/appPriceSchedules` + USA `appPricePoints` |
| App Privacy practices | **Console only** |

## IAP

| Action | Endpoint |
| --- | --- |
| Subscription group | `POST /v1/subscriptionGroups` |
| Group localization | `POST /v1/subscriptionGroupLocalizations` |
| Subscription | `POST /v1/subscriptions` |
| Sub localization | `POST /v1/subscriptionLocalizations` |
| Consumable create | `POST /v2/inAppPurchases` |
| Consumable localization | `POST /v1/inAppPurchaseLocalizations` |
| Sub availability | `POST /v1/subscriptionAvailabilities` |
| Sub prices | `POST /v1/subscriptionPrices` + `GET .../equalizations` loop |
| IAP availability | `POST /v1/inAppPurchaseAvailabilities` |
| IAP prices | `POST /v1/inAppPurchasePriceSchedules` |

Paid Apps agreement must be active. Poll product `state` until `READY_TO_SUBMIT`.
Missing equalization territories or IAP availability → stuck `MISSING_METADATA`.

### IAP review screenshot + notes

| Action | Endpoint |
| --- | --- |
| Sub review note | `PATCH /v1/subscriptions/{id}` `reviewNote` |
| Sub review screenshot | `POST /v1/subscriptionAppStoreReviewScreenshots` → PUT → `PATCH` commit |
| Consumable review note | `PATCH` inAppPurchase `reviewNote` |
| Consumable review screenshot | `POST /v1/inAppPurchaseAppStoreReviewScreenshots` (relate `inAppPurchaseV2`) |

`fileSize` = JSON **number**. Poll `assetDeliveryState` without mixing unrelated
`fields[...]` types. `IMAGE_INCORRECT_DIMENSIONS` → upscale ~1290×2796, `DELETE`
FAILED, re-reserve. **Ask the user** for Pro + credits paywall screenshots.

## Review detail (version)

`POST` / `PATCH` `appStoreReviewDetails` — `contactPhone` like `+90 532 000 0000`.

## App resolve

| Approach | Endpoint |
| --- | --- |
| Bundle ID | `GET /v1/apps?filter[bundleId]=…` |
| Numeric Apple ID | `GET /v1/apps/{id}` |

Transporter `409` relationship invalid → wrong provider / stale app ID / agreements,
not a bad IPA first. Re-`app:resolve`.

## Versions & localizations

Prefer editable states (`PREPARE_FOR_SUBMISSION`, …). First version: omit `whatsNew`
if `STATE_ERROR`.

| Field | Max (code points) |
| --- | --- |
| `promotionalText` | 170 |
| `whatsNew` / `description` | 4000 |
| `keywords` | 100 |
| App Info `subtitle` | 30 |

Locales: `en-US`, `tr`, `es-ES`, `de-DE`, `fr-FR`, `zh-Hant`, `ar-SA` — list first.

## Rate limits / errors

JSON:API `status` / `code` / `detail`. Retry `429` / `5xx` with backoff.
Age rating `409 ATTRIBUTE.REQUIRED` → add the named field (correct JSON type) and retry.
Age rating `409 ATTRIBUTE.TYPE` → boolean vs string mismatch.

## Out of scope / Console

- App Privacy **practices** (nutrition labels)
- New App create
- Paid Apps agreement **accept** click
- Listing screenshot/preview sets (deepen later)
- Submit for Review (explicit user ask only)
- IPA bytes via ASC API (use `eas submit` / Transporter)
