# APC Launchpad — App Information & review forms

Clear **Unable to Add for Review** blockers via ASC API where possible.
Do **not** Submit for Review unless the user explicitly asks.
Do **not** upload listing screenshots unless the user asks (they often own that).

## Resolve IDs

```text
GET /v1/apps/{ASC_APP_APPLE_ID}?include=appInfos
→ appInfos[0].id  (= often same UUID as ageRatingDeclarations id)
GET /v1/apps/{id}/appInfos?include=primaryCategory,ageRatingDeclaration,appInfoLocalizations
```

## Category

```http
PATCH /v1/appInfos/{appInfoId}
```

```json
{
  "data": {
    "type": "appInfos",
    "id": "{appInfoId}",
    "relationships": {
      "primaryCategory": { "data": { "type": "appCategories", "id": "PRODUCTIVITY" } },
      "secondaryCategory": { "data": { "type": "appCategories", "id": "UTILITIES" } }
    }
  }
}
```

List: `GET /v1/appCategories?filter[platforms]=IOS`. Common: `PRODUCTIVITY`,
`UTILITIES`, `BUSINESS`, `GRAPHICS_AND_DESIGN`, `EDUCATION`. Ask user if unsure.

## Content Rights

```http
PATCH /v1/apps/{appId}
```

```json
{
  "data": {
    "type": "apps",
    "id": "{appId}",
    "attributes": {
      "contentRightsDeclaration": "DOES_NOT_USE_THIRD_PARTY_CONTENT"
    }
  }
}
```

Use `USES_THIRD_PARTY_CONTENT` only when the app ships third-party copyrighted
material without full rights narrative — ask the user when ambiguous.

## Age Ratings

```http
PATCH /v1/ageRatingDeclarations/{ageRatingDeclarationId}
```

`GET_INSTANCE` is often **403** — only UPDATE is allowed. Include **every**
currently required attribute or ASC returns `ENTITY_ERROR.ATTRIBUTE.REQUIRED`.

Types matter:

| Attribute | Type (typical) |
| --- | --- |
| `alcoholTobaccoOrDrugUseOrReferences`, `contests`, `gamblingSimulated`, violence/sex/horror/mature/medical/profanity/guns… | enum string `NONE` / `INFREQUENT` / `FREQUENT` |
| `gambling`, `lootBox`, `parentalControls`, `ageAssurance`, `healthOrWellnessTopics`, `advertising`, `messagingAndChat`, `userGeneratedContent`, `unrestrictedWebAccess`, `socialMedia`, `socialMediaAgeRestricted` | **boolean** |

### Social Media (ASC API 4.4.1+)

Console **Age Ratings → Features** maps to:

| Console label | Attribute |
| --- | --- |
| Social Media | `socialMedia` |
| Social Media Disabled for Users Under 13 | `socialMediaAgeRestricted` |

**Prerequisites** (Apple rejects the PATCH otherwise):

1. `socialMedia: true` requires `userGeneratedContent: true` (same PATCH or already set).
2. `socialMediaAgeRestricted: true` requires **both** `socialMedia: true` and `ageAssurance: true`.

`ageAssurance` means the app uses age assurance (e.g. Declared Age Range API) before enabling social features for under-13. Only set `socialMedia*` / `ageAssurance` when they match the real product — do not invent Declared Age Range if the app does not call it.

Prefer reading current attrs via
`GET /v1/apps/{id}/appInfos?include=ageRatingDeclaration`, then PATCH with a full
attribute set (omit read-only `ageRatingOverride*` / `koreaAgeRatingOverride` /
`kidsAgeBand` / `developerAgeRatingInfoUrl`).

Example baseline for an AI productivity app with AdMob + in-app chat + user docs
**and** social / under-13 lockout:

```json
{
  "data": {
    "type": "ageRatingDeclarations",
    "id": "{id}",
    "attributes": {
      "alcoholTobaccoOrDrugUseOrReferences": "NONE",
      "contests": "NONE",
      "gambling": false,
      "gamblingSimulated": "NONE",
      "gunsOrOtherWeapons": "NONE",
      "horrorOrFearThemes": "NONE",
      "matureOrSuggestiveThemes": "NONE",
      "medicalOrTreatmentInformation": "NONE",
      "profanityOrCrudeHumor": "NONE",
      "sexualContentGraphicAndNudity": "NONE",
      "sexualContentOrNudity": "NONE",
      "violenceCartoonOrFantasy": "NONE",
      "violenceRealistic": "NONE",
      "violenceRealisticProlongedGraphicOrSadistic": "NONE",
      "unrestrictedWebAccess": true,
      "advertising": true,
      "messagingAndChat": true,
      "userGeneratedContent": true,
      "socialMedia": true,
      "socialMediaAgeRestricted": true,
      "ageAssurance": true,
      "healthOrWellnessTopics": false,
      "lootBox": false,
      "parentalControls": false
    }
  }
}
```

No social feed → set `socialMedia: false`, `socialMediaAgeRestricted: false`, and
keep `ageAssurance` accurate for the app. Adjust other booleans to the real app
(no ads → `advertising: false`). On `409` with a new required attribute name, add
it and retry — Apple expands the questionnaire.

## App price (free)

1. `GET /v1/apps/{id}/appPricePoints?filter[territory]=USA&limit=200`
2. Find `customerPrice` `0` / `0.0`
3. `POST /v1/appPriceSchedules` with inline `appPrices` + that `appPricePoint`,
   `baseTerritory: USA`

Paid apps: pick the correct tier the same way; equalize / schedule per product policy.

## Subtitle (App Information)

≤ **30** Unicode code points. Required for a polished listing; set for every
locale you ship (`en-US`, `tr`, …).

```http
PATCH /v1/appInfoLocalizations/{id}
```

```json
{
  "data": {
    "type": "appInfoLocalizations",
    "id": "{id}",
    "attributes": {
      "subtitle": "AI CVs, cards & PDFs"
    }
  }
}
```

Workflow:

1. `GET /v1/apps/{id}/appInfos` → `appInfoId`
2. `GET /v1/appInfos/{appInfoId}/appInfoLocalizations`
3. `PATCH` each localization with a locale-appropriate subtitle
4. Validate length with code-point count (not `.length` alone for emoji)

Ask the user for copy if unclear; keep it benefit-focused and distinct from the
app **name**. Same endpoint also accepts `name`, `privacyPolicyUrl`,
`privacyChoicesUrl`.

## Privacy Policy URL (App Information)

```http
PATCH /v1/appInfoLocalizations/{id}
```

```json
{
  "data": {
    "type": "appInfoLocalizations",
    "id": "{id}",
    "attributes": {
      "privacyPolicyUrl": "https://voysapps.io/app/<slug>/privacy-policy"
    }
  }
}
```

You can set `subtitle` + `privacyPolicyUrl` in one PATCH. Also set version
localization `supportUrl` / `marketingUrl` to the same site (`/support`, product
home). Prefer `/app/<slug>/…` over legacy `/<slug>/…`.

## Privacy Practices (Console only)

**App Privacy** nutrition labels are **not** reliably writable via ASC API.
Open:

`https://appstoreconnect.apple.com/apps/{ASC_APP_APPLE_ID}/appPrivacy`

Agent opens URL; **Admin** user completes data types (Account, Purchases,
Identifiers, Usage, Diagnostics, etc.) to match real SDKs (Supabase, RC,
Firebase, AdMob, attribution).

## Subscription group localization

Empty group **Localization → Create** is easy to miss:

```http
POST /v1/subscriptionGroupLocalizations
```

`name` (e.g. `Pro`) + optional `customAppName` (app display name) for `en-US` + `tr`.

## IAP Ready to Submit checklist

| Check | Notes |
| --- | --- |
| EN + TR product locs | Subs + consumables |
| Group locs | Above |
| Availability | Subs + **consumables** (`inAppPurchaseAvailabilities`) |
| Prices | USA + **all** subscription equalizations (count ≈ territory count) |
| Review note | Paywall path + SKUs + prices + contact email |
| Review screenshot | User-provided; ≥ ~1290×2796 PNG; poll `COMPLETE` |
| State | `READY_TO_SUBMIT` (not `MISSING_METADATA`) |

Console “Subscription Prices” may look empty while API already has prices —
hard-refresh; verify with `GET .../prices?filter[territory]=USA`.

## Build / submit (upload only)

```bash
eas credentials -p ios          # once if non-interactive build fails
eas build -p ios --profile production
eas submit -p ios --latest      # → ASC; NOT App Review
```

Attach processed build on the version in Console (or via API relationship) when
ready. **Submit for Review** only on explicit user request.
