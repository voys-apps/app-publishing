# Roadmap — Voys Apps publishing toolkit

Target stack (our apps look like this):

| Layer | Typical choice |
| --- | --- |
| Client | Expo / React Native, `expo-router`, EN + TR (sometimes more) |
| Backend | Supabase (Auth, Postgres, Edge Functions) |
| Monetization | RevenueCat (SDK + Hosted UI + webhooks → credits / entitlements) |
| Android | Google Play + Android Publisher API, EAS **local** AAB + Play API upload |
| iOS | App Store Connect API (metadata) + EAS submit / Transporter (IPA) |
| Secrets | SA JSON / ASC `.p8` / API keys in `secrets/` or 1Password — never git |
| Firebase | Management API for apps + configs; Analytics ToS / APNs may need Console |

This repo should stay **store + monetization + Firebase provision + release automation**. App feature code (chat UI, receipts, etc.) stays in each app repo.

---

## Already shipped

| Piece | Role |
| --- | --- |
| `play-launchpad` | Play listing, IAP/subs, assets upload, closed testing, local AAB CI, production-access questionnaire drafts |
| `apc-launchpad` | ASC: metadata, IAP (prices/availability/review shots), app forms (category/age/content rights/free price), review-forms.md; New App + App Privacy practices Console |
| `rc-launchpad` | Catalog + Hosted UI + **credits-bridge** (RTDN + Supabase webhook) |
| `store-assets` | **Priority** — generate + exact-size QA (512 / 1024×500 / screenshots); upload via play-launchpad |
| `firebase-launchpad` | Firebase apps, configs, Analytics handoff, FCM → EAS |
| `auth-launchpad` | Google + Apple (SIWA) social login → Supabase |
| `admob-launchpad` | Console handoff + paste `ca-app-pub` → EAS env |
| `templates/play-console` | Node scripts for any package name |
| `templates/app-store-connect` | Node ESM + `jose` ASC JWT client |
| `templates/revenuecat` | Python list/bootstrap catalog via API v2 |
| `templates/revenuecat-webhook` | Thin Deno stub + constants map |
| `templates/expo/easignore.example` | Local build keeps `.env*` |
| `templates/firebase` | Provision + config download |
| `templates/auth-supabase` | Google OAuth + Supabase provider helpers |

---

## TODO — next skills (parked)

Do **not** start these unless the user asks. Track here only.

| Status | Skill / item | Notes |
| --- | --- | --- |
| TODO | `eas-ship` | Local-first release contract (`.easignore`, version bump, no cloud default) — some of this already lives in `play-launchpad/local-android-ci.md` |
| TODO | `apc-launchpad` deepen | Listing screenshot/preview set upload; appInfo name/subtitle polish; IPA attach helper |
| DONE | `apc-launchpad` IAP scaffold | subscriptionGroups + subscriptions + `/v2/inAppPurchases`; multi-team key note |
| DONE | `apc-launchpad` review forms | category, content rights, age rating, free `appPriceSchedules`, privacyPolicyUrl, IAP availability/prices/review shots; `review-forms.md` |
| TODO | Privacy / Terms / Support URL checklist | partially covered in apc `privacyPolicyUrl` + `/app/<slug>` pattern — still want shared checklist skill |
| DONE | `auth-launchpad` Apple | SIWA capability API + Services ID/key Console handoff |
| TODO | `release-checklist` | Week-1 new-app walkthrough checklist |
| TODO | Data Safety builder | Verified answers only → CSV/API |
| TODO | Unit economics / pricing sheet template | Forkable `UNIT_ECONOMICS.md` |
| TODO | Multi-app inventory (`apps.yaml`) | Optional internal |
| TODO | Monitoring (RC charts / Play vitals) | Later |

### Monetization deepen (still under `rc-launchpad`, not new skills)

| Status | Item |
| --- | --- |
| TODO | Virtual currency helpers |
| TODO | Targeting / current offering automation |
| TODO | Shared YAML catalog consumed by Play + RC |

---

## Suggested folder growth

```text
skills/
  play-launchpad/          # shipped
  apc-launchpad/           # shipped — ASC metadata + IAP + review-forms
  rc-launchpad/            # shipped — catalog + paywall + credits-bridge
  store-assets/            # shipped — generation + sizes
  firebase-launchpad/      # shipped
  auth-launchpad/          # shipped
  admob-launchpad/         # shipped
  release-checklist/       # TODO
  eas-ship/                # TODO

templates/
  play-console/            # shipped
  app-store-connect/       # shipped
  revenuecat/              # shipped
  revenuecat-webhook/      # shipped (stub)
  firebase/                # shipped
  auth-supabase/           # shipped
  expo/easignore.example   # shipped
```

Ship one skill + one template at a time. Prefer extending `rc-launchpad` / `play-launchpad` / `apc-launchpad` over splinter skills unless the trigger clearly diverges.
