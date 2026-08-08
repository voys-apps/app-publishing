# Firebase Launchpad — API constraints

## Auth / Service Usage

| Symptom | Cause | Fix |
| --- | --- | --- |
| `SERVICE_DISABLED` Firebase Management | API off | Enable `firebase.googleapis.com` with Owner SA |
| `403` enable service | SA not Owner | Grant Owner; retry |
| `404` GET `projects/{id}` | Firebase not added | `POST …:addFirebase` + poll |
| Old project id gone | Deleted Firebase | New `addFirebase` on live GCP; refresh configs + EAS FCM |

### APIs to enable (Owner SA)

`firebase.googleapis.com`, `fcm.googleapis.com`, `fcmregistrations.googleapis.com`,
`firebaseinstallations.googleapis.com`, `analytics.googleapis.com`,
`analyticsadmin.googleapis.com`, plus CRM / Service Usage as needed.

Scopes: `cloud-platform`, `firebase`, `analytics.edit`.

## Management API (v1beta1)

| Action | Call |
| --- | --- |
| Get / add Firebase | `GET projects/{id}` / `POST projects/{id}:addFirebase` |
| Android / iOS apps | `GET/POST …/androidApps` / `iosApps` |
| Config download | `GET …/androidApps/{id}/config` (base64) |
| Analytics state | `GET projects/{id}/analyticsDetails` |
| Link GA | `POST projects/{id}:addGoogleAnalytics` |

Poll `operations/workflows/…` until `done`.

## Google Analytics

- **Automatable** only if a GA account already exists → `addGoogleAnalytics`.
- **First account:** human ToS. **Skill contract:**
  1. Agent runs `pnpm console:open` or `analytics:status -- --open` (or `open <url>`)
  2. User clicks **Enable Google Analytics** / Integrations → Enable
  3. Agent re-checks `analyticsDetails`
- Prefer Integrations URL over fighting Console UI with Playwright.
- `IS_ANALYTICS_ENABLED` in plist is **not** source of truth.

### Click checklist (document for user)

1. [Integrations](https://console.firebase.google.com/project/PROJECT_ID/settings/integrations) → Google Analytics → **Enable**
2. Accept Terms of Service if shown
3. Create new GA4 property (or link existing) → confirm
4. Optional: Analytics overview for Android app — Enable CTA should be gone
5. `pnpm analytics:status` → expect HTTP 200

## EAS FCM V1 (Expo Push)

### What works

Script `upload-eas-fcm.mjs` / `pnpm eas:upload-fcm`:

1. Ensure SA `…-fcm@PROJECT` + `roles/firebasecloudmessaging.admin`
2. Create JSON key (gitignored)
3. Expo GraphQL:
   - `createGoogleServiceAccountKey(accountId, { jsonKey })`
   - `createAndroidAppCredentials` if missing
   - `setGoogleServiceAccountKeyForFcmV1`
4. Auth headers: `Authorization: Bearer EXPO_TOKEN` **or** `expo-session: <sessionSecret>`

Endpoint: `https://api.expo.dev/graphql`

### What does **not** work

| Approach | Result |
| --- | --- |
| `eas credentials` + `--non-interactive` | Cannot set Google Service Account Keys ([#2610](https://github.com/expo/eas-cli/issues/2610)) |
| Guessing `@username/slug` | `EXPERIENCE_NOT_FOUND` if app is under **org** (`expo.owner`) |
| Uploading dead Firebase Admin key (deleted project) | EAS accepts it but push fails — replace after reprovision |
| Committing FCM JSON | Secret leak — gitignore `secrets/*` |

### Resolve EAS identity

```text
fullName = @${app.json expo.owner}/${app.json slug}
# QuickDoc example: @appsvoyss-organization/quickdoc
# NOT @appsvoys/quickdoc when owner is the org
```

List accounts via GraphQL `me { accounts { name } }` if unsure.

### Client still needs

- Committed `google-services.json` with matching package
- Native build / Expo Push token from device
- Unrestricted or correctly restricted Android API key (FCM Registration + Installations; Play **app signing** SHA-1) — see [Expo FCM docs](https://docs.expo.dev/push-notifications/fcm-credentials/)

## Push: iOS APNs

No Firebase Management API for APNs key upload. Human: Firebase Console →
Project settings → Cloud Messaging → APNs auth key (`.p8`).

## Expo / RNFirebase traps

- Expo Go: no `RNFBAppModule` → skip Firebase
- Package / bundle must match Play / ASC
- After project migration: overwrite configs **and** re-run `eas:upload-fcm`

## Do not

- Playwright for app create / config download / EAS FCM when GraphQL works  
- Mix FCM private key into RC or Play credential uploads  
- Claim GA / APNs done without Console confirmation  
- Use interactive `eas credentials` as the primary agent path for FCM V1  
