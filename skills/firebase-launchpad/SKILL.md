---
name: firebase-launchpad
description: >-
  Provision Firebase for Expo / React Native apps via Management API: enable
  APIs, addFirebase on a GCP project, create Android + iOS apps, download
  google-services.json and GoogleService-Info.plist, link Google Analytics
  (with ToS handoff), create FCM V1 service-account keys, and upload them to
  EAS for Expo Push via Expo GraphQL (not interactive eas credentials). Use
  when the user mentions Firebase, FCM, google-services.json,
  GoogleService-Info.plist, Firebase Analytics, Expo push credentials, EAS
  FCM V1, or wants to avoid manual Firebase Console / eas credentials menus.
  Pair with play-launchpad (shared Owner GCP) and rc-launchpad.
---

# Firebase Launchpad

Ship **Firebase project + Android/iOS apps + client configs + Analytics handoff
+ EAS FCM V1 push credentials** via APIs. Prefer scripts over Playwright /
interactive `eas credentials` menus.

**Install:**

```bash
npx skills add voys-apps/app-publishing --skill firebase-launchpad
# or full toolkit:
npx skills add voys-apps/app-publishing -g
```

Templates: `templates/firebase/` → app `scripts/firebase/`.

Official docs (prefer live over memory):

1. https://firebase.google.com/docs/projects/api/workflow_set-up-and-manage-project  
2. https://firebase.google.com/docs/reference/firebase-management/rest  
3. https://docs.expo.dev/push-notifications/fcm-credentials/  
4. https://developers.google.com/analytics/devguides/config/admin/v1  

## When to use which tool

| Need | Prefer |
| --- | --- |
| Add Firebase + Android/iOS apps + download configs | **This skill** + `scripts/firebase` |
| Link GA4 after an account exists | `projects:addGoogleAnalytics` |
| First-ever GA account (ToS) | **Agent opens Console URLs** (`pnpm console:open` / `open`); **user clicks** Enable — never Playwright-click ToS |
| **Upload FCM V1 key to EAS** (Expo Push Android) | `pnpm eas:upload-fcm` (Expo GraphQL) — **not** interactive `eas credentials` |
| Play listing / IAP | **play-launchpad** |
| RC catalog / paywalls | **rc-launchpad** |
| iOS APNs `.p8` for FCM | Agent opens Cloud Messaging URL; **user uploads** `.p8` |

## Credentials

| Variable / path | Purpose |
| --- | --- |
| `GOOGLE_FIREBASE_SERVICE_ACCOUNT_JSON` | Preferred Owner SA |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Fallback when Play + Firebase share GCP |
| `scripts/firebase/secrets/firebase-service-account.json` | Local convention |
| `scripts/firebase/secrets/fcm-expo-push-service-account.json` | Generated FCM SA for EAS (gitignored) |
| `EXPO_TOKEN` or `eas login` (`~/.expo/state.json`) | Auth for Expo GraphQL FCM upload |
| `EAS_ACCOUNT_NAME` / `EAS_PROJECT_SLUG` | From `app.json` **`expo.owner`** + **`slug`** |

**GCP IAM:** Owner on `project_id` (Voys rule). Agents enable APIs + create FCM SA
(`roles/firebasecloudmessaging.admin`) themselves.

Never commit Admin / FCM private keys. Client `google-services.json` / plist OK.

## Workflow

```
Task Progress:
- [ ] 1. Owner SA + enable firebase / FCM / Analytics Admin APIs
- [ ] 2. addFirebase if GET projects/{id} is 404
- [ ] 3. Create Android + iOS apps (list first)
- [ ] 4. Download configs → config/firebase/
- [ ] 5. Wire Expo googleServicesFile (if needed)
- [ ] 6. Analytics: `analytics:status` — if 404, **open** Console handoff URLs; user clicks Enable; re-check
- [ ] 7. EAS FCM V1: set EAS_ACCOUNT_NAME from expo.owner → pnpm eas:upload-fcm
- [ ] 8. iOS APNs: **open** Cloud Messaging URL; user uploads .p8 when needed
- [ ] 9. Native / dev-client build to verify (not Expo Go)
```

### Human click handoffs (agent opens, user clicks)

Full table (Firebase + Play + RC): **[handoffs.md](handoffs.md)**.

API / SA **cannot** accept Google Analytics Terms of Service or upload APNs keys.
**Agents must:**

1. Print the exact click steps (bullets in chat)  
2. Open the Console URL(s) with `open` (macOS) or `pnpm console:open`  
3. Wait for the user to click  
4. Verify with `pnpm analytics:status` (or re-download configs)

**Agents must not:** Playwright / CDP-click Enable or ToS as the primary path. Opening the page + documenting clicks is the skill contract for **every** Console-only step.

| Step | URL pattern | User clicks |
| --- | --- | --- |
| Analytics Enable (preferred) | `…/project/{id}/settings/integrations` | Google Analytics → **Enable** / Link → accept ToS → create/select GA4 property |
| Analytics Enable (alt) | `…/analytics/app/android:{package}/overview` | **Enable Google Analytics** if still shown |
| iOS APNs | `…/project/{id}/settings/cloudmessaging` | Upload APNs Authentication Key (`.p8`) |
| RC Play SA (via rc-launchpad) | RC Play app → Service credentials | Paste SA JSON → Save |
| Play RTDN topic (via play-launchpad) | Play → Monetization setup | Paste Pub/Sub topic → Save → test |

```bash
pnpm console:open
# or only analytics:
pnpm console:open -- --only=integrations
pnpm analytics:status -- --open
```

Use **pnpm** for all template scripts (`pnpm install`, `pnpm <script>`). Do not document `npm run`.
### Template commands

```bash
cp -R templates/firebase your-app/scripts/firebase
# edit src/catalog.mjs: FIREBASE_PROJECT_ID, PACKAGE_NAME, EAS_ACCOUNT_NAME, EAS_PROJECT_SLUG

cd scripts/firebase && pnpm install
export GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=../play-console/secrets/play-api-service-account.json

pnpm auth:check
pnpm provision
pnpm configs:download
pnpm analytics:status -- --open   # opens Enable pages; YOU click
pnpm console:open                 # integrations + analytics + APNs pages
pnpm eas:upload-fcm
```
## EAS FCM V1 (works via GraphQL)

`eas credentials` **cannot** set Google Service Account Keys in `--non-interactive`
mode ([expo/eas-cli#2610](https://github.com/expo/eas-cli/issues/2610)). Agents
must use Expo GraphQL instead (`upload-eas-fcm.mjs`):

1. Create (or reuse) SA `<app>-fcm@PROJECT.iam.gserviceaccount.com`
2. Grant `roles/firebasecloudmessaging.admin`
3. Create JSON key → `secrets/fcm-expo-push-service-account.json`
4. `createGoogleServiceAccountKey` + `setGoogleServiceAccountKeyForFcmV1` on Android app credentials
5. Auth: `EXPO_TOKEN` **or** `expo-session` from `~/.expo/state.json` after `eas login`

**Critical:** resolve EAS app as `@${expo.owner}/${slug}` — personal username
(`@appsvoys/…`) often **404 EXPERIENCE_NOT_FOUND** when the app lives under an org.

Docs: https://docs.expo.dev/push-notifications/fcm-credentials/

## Known blockers (document + hand off)

| Blocker | Automatable? | What to do |
| --- | --- | --- |
| GCP SA not Owner | No until granted | Ask user for Owner; then enable APIs |
| Firebase Management API disabled | Yes with Owner | Service Usage enable |
| Dead old Firebase project id | Yes | `addFirebase` on live GCP; overwrite configs; re-upload EAS FCM |
| First Google Analytics account / ToS | **No click automation** | Agent **opens** Integrations / Analytics URLs; **user clicks** Enable; then `analytics:status` |
| `eas credentials` FCM upload non-interactive | **No** (CLI) | Use `pnpm eas:upload-fcm` GraphQL path |
| Wrong EAS account slug | Yes if corrected | Read `app.json` `owner` + `slug`; list `me.accounts` |
| No `eas login` / `EXPO_TOKEN` | No | User logs in or creates access token |
| iOS APNs `.p8` | **No** via Management API | Agent opens Cloud Messaging URL; user uploads `.p8` |
| Expo Go / no native module | N/A | Dev client or store build for Analytics/FCM |
| Restricted Android API key in google-services.json | Partial | Cloud Console API key restrictions / Play SHA-1 (see Expo FCM docs) |
| Play Monetization RTDN topic paste | No | Play Console (rc-launchpad / play-launchpad) |
| RC Play SA JSON upload | No | RC dashboard only |

Full traps: [api-constraints.md](api-constraints.md).

## Hard rules

1. Owner SA — enable APIs / IAM / FCM SA yourself  
2. List before create (Firebase apps, EAS credentials)  
3. Never fake Analytics ToS or APNs upload — **open URLs, user clicks** (`console:open`)  
4. Never commit FCM / Admin private JSON  
5. Prefer GraphQL `eas:upload-fcm` over interactive `eas credentials`  
6. Use `expo.owner` for EAS fullName  
7. Prefer Management API over Playwright for Firebase apps/configs  
8. Do **not** CDP/Playwright-click Analytics Enable/ToS as the default — open + document clicks  

## Additional resources

- [handoffs.md](handoffs.md) — **all** Console click tables (Firebase / Play / RC)  
- [api-constraints.md](api-constraints.md) — API traps, Analytics ToS, FCM/APNs, EAS GraphQL  
- [scaffold.md](scaffold.md)  
- [examples.md](examples.md)  
