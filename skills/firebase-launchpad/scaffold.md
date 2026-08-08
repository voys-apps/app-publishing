# Firebase Launchpad — scaffold

Prefer copying the template:

```bash
cp -R /path/to/app-publishing/templates/firebase your-app/scripts/firebase
```

## Layout

```
scripts/firebase/
  package.json
  secrets/                 # gitignored JSON + README
  src/
    client.mjs             # auth + firebaseFetch + pollOperation
    catalog.mjs            # projectId, packageName, bundleId, displayName
    auth-check.mjs
    provision.mjs          # addFirebase + create apps (idempotent)
    download-configs.mjs   # write ../../config/firebase/*
    analytics-status.mjs   # analyticsDetails + Console handoff URL (+ --open)
    open-console-handoffs.mjs  # open Integrations / Analytics / APNs for user clicks
    upload-eas-fcm.mjs     # FCM SA key + Expo GraphQL FCM V1 assign
```

## Minimal `package.json`

```json
{
  "name": "firebase-scripts",
  "private": true,
  "type": "module",
  "scripts": {
    "auth:check": "node ./src/auth-check.mjs",
    "provision": "node ./src/provision.mjs",
    "configs:download": "node ./src/download-configs.mjs",
    "analytics:status": "node ./src/analytics-status.mjs",
    "console:open": "node ./src/open-console-handoffs.mjs",
    "eas:upload-fcm": "node ./src/upload-eas-fcm.mjs"
  },
  "dependencies": {
    "googleapis": "^164.0.0"
  }
}
```
## `catalog.mjs` (per app)

```js
export const FIREBASE_PROJECT_ID = 'your-gcp-project-id'
export const PACKAGE_NAME = 'com.example.yourapp'
export const BUNDLE_ID = 'com.example.yourapp'
export const DISPLAY_NAME = 'Your App'
export const CONFIG_DIR = new URL('../../../config/firebase/', import.meta.url)
// From app.json expo.owner + slug (org account, not personal username):
export const EAS_ACCOUNT_NAME = 'your-expo-org'
export const EAS_PROJECT_SLUG = 'your-app-slug'
```

For Voys apps, `PACKAGE_NAME` and `BUNDLE_ID` are usually identical reverse-DNS ids.

## App wiring (Expo)

```js
// app.config.js
android: { googleServicesFile: './config/firebase/google-services.json', … }
ios: { googleServicesFile: './config/firebase/GoogleService-Info.plist', … }
plugins: ['@react-native-firebase/app', …]
// app.json: "owner": "<org>", "extra.eas.projectId": "…"
```

## secrets/README.md

Document Owner requirement, FCM key gitignore, env fallbacks, and
`eas:upload-fcm` needing `eas login` or `EXPO_TOKEN`. Prefer **pnpm**.

Human clicks: see skill [handoffs.md](../../skills/firebase-launchpad/handoffs.md).
