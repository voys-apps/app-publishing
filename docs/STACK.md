# Stack assumptions (Voys mobile apps)

Agents working from **app-publishing** skills should assume target apps look like this unless the user says otherwise.

## Product shape

- Consumer mobile app on **iOS + Android**
- **Expo** (dev client / EAS Build), often `expo-router`
- Locales: at least **en** + **tr** store listings and in-app copy
- Optional guest mode + Google / Apple / email auth via **Supabase Auth**

## Backend

- **Supabase**: Postgres, RLS, Edge Functions (Deno)
- Billing truth often mirrored in DB via **RevenueCat webhook** (credits, entitlement period)
- Domain features (docs, receipts, workouts, …) stay in the app repo — not here

## Monetization

- **RevenueCat** SDK in app + Hosted UI paywalls
- Store products created in **Play** / **App Store**, imported or mirrored in RC
- Typical catalog: Pro monthly + yearly + credit packs
- Shared product IDs across stores when possible (`com.company.app.…`)

## Release

- `pnpm build:android` / `build:ios` → EAS local or cloud
- Play closed testing via custom `CLOSED_TESTING` track + Google Group
- First publish of a **draft** Play app may require Console first-launch / Start rollout — API cannot always `completed`

## Firebase / analytics / push

- Firebase often on the **same GCP** as Play (`addFirebase`) or a separate Owner SA
- Client configs: `config/firebase/google-services.json` + `GoogleService-Info.plist`
- Provision via **firebase-launchpad** / `scripts/firebase` (Management API)
- First Google Analytics link needs Console ToS / Integrations Enable
- iOS push: APNs key upload in Firebase Console (not Management API)
- RNFirebase + modular `services/analytics` in the app — needs native build (not Expo Go)

## Branding / legal

- Support & legal pages under `https://voysapps.io/<app>/…`
- Play contact email + website set via listing details API
- Store assets: icon 512, feature graphic **1024×500**, tall phone screenshots

## What agents should do first in an app repo

1. Find `app.json` / `eas.json` → `package` / bundle id  
2. Find existing `scripts/play-console` or RC paywall scripts — prefer them  
3. Find product ID constants / docs under `docs/subscription` or similar  
4. Never invent Data Safety answers or commit secrets  

See [ROADMAP.md](./ROADMAP.md) for planned skills and [CODING_CONVENTIONS.md](./CODING_CONVENTIONS.md) for how to extend this toolkit.
