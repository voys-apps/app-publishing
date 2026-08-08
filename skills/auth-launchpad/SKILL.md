---
name: auth-launchpad
description: >-
  Wire Google (and later Apple) Sign-In for Expo apps on Supabase Auth: Google
  Auth Platform branding + OAuth clients (Console handoffs), Supabase provider
  enable via Management API when SUPABASE_ACCESS_TOKEN is available, redirect
  URL checklist. Use when the user mentions Google Sign-In, Supabase Auth
  providers, OAuth consent branding, Client ID/Secret for Supabase, or
  auth-launchpad. Pair with firebase-launchpad (same GCP often) and
  handoffs.md click contract (agent opens URLs; user clicks ToS/branding).
---

# Auth Launchpad

Configure **Supabase social login** (Google first) for Voys Expo apps.
App UI usually already calls `signInWithOAuth({ provider: 'google' })`.

**Install:**

```bash
npx skills add voys-apps/app-publishing --skill auth-launchpad
```

Templates: `templates/auth-supabase/` → `scripts/auth-supabase/`.

Docs (prefer live):

1. https://supabase.com/docs/guides/auth/social-login/auth-google  
2. https://console.cloud.google.com/auth/overview  
3. https://supabase.com/docs/reference/api/v1-update-auth-service-config  

## Automatable vs click handoffs

| Step | Automatable? | How |
| --- | --- | --- |
| Enable GCP APIs (IAP, etc.) | Yes (Owner SA) | Service Usage |
| **OAuth brand** (app title + support email) | **Yes if** GCP project is in an **Organization** | `POST iap.googleapis.com/…/brands` — see api-constraints |
| Brand on **no-org** project | **No** via API | `400 Project must belong to an organization` → Console or move project into a Cloud Org |
| Logo / privacy URLs / External / Verify | **No** | Auth Platform Branding (agent opens; user clicks) |
| **Create OAuth Web client** + redirect for Supabase | **No** via IAP clients API (IAP-locked) | Auth Platform Clients → Web application |
| Enable Google on Supabase | **Yes** with token | `PATCH …/config/auth` + client id/secret |
| Redirect URLs on Supabase | Yes with token / or Dashboard | Site URL + `quickdoc://auth/oauth-callback` |
| Paste secrets into Supabase without token | No | Open Providers; user pastes |

**Click contract (same as firebase-launchpad):** agent opens URL + prints clicks; user acts; agent verifies. See also [../firebase-launchpad/handoffs.md](../firebase-launchpad/handoffs.md).

## Credentials

| Variable | Purpose |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | Management API (Personal Access Token) |
| `SUPABASE_PROJECT_REF` | e.g. `your-project-ref` |
| `GOOGLE_OAUTH_CLIENT_ID` | Web client ID (after Console create) |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Web client secret (never commit) |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Optional — same Owner GCP as Firebase/Play |

## Workflow

```
Task Progress:
- [ ] 1. Confirm app uses signInWithOAuth google + redirect scheme
- [ ] 2. Open Google Auth Platform Branding → user sets app name, support email, logo, links
- [ ] 3. Open Audience (External for consumer apps) + Scopes (openid, email, profile)
- [ ] 4. Open Clients → Create **Web application**
- [ ] 5. Authorized redirect URI = https://{ref}.supabase.co/auth/v1/callback
- [ ] 6. Save Client ID + Secret locally (gitignored)
- [ ] 7. Optional: Android + iOS clients; add IDs as additional_client_ids
- [ ] 8. pnpm auth:google:apply (Management API) OR open Supabase Providers for paste
- [ ] 9. Ensure redirect URLs include app scheme callback
- [ ] 10. Test native build Google login
```

### Voys Expo conventions

```text
Scheme callback:  {scheme}://auth/oauth-callback
Supabase callback: https://{PROJECT_REF}.supabase.co/auth/v1/callback
Providers: google (+ apple later), anonymous often on for guest → link
```

## Template commands

```bash
cp -R templates/auth-supabase your-app/scripts/auth-supabase
# edit src/catalog.mjs

cd scripts/auth-supabase && pnpm install
export SUPABASE_ACCESS_TOKEN=sbp_…   # https://supabase.com/dashboard/account/tokens
export GOOGLE_OAUTH_CLIENT_ID=….apps.googleusercontent.com
export GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-…

pnpm console:open          # branding + clients + supabase providers
pnpm auth:google:status    # GET auth config (needs token)
pnpm auth:google:apply     # PATCH enable google + optional redirects
```

## Hard rules

1. Prefer **pnpm** for scripts  
2. Never commit Client Secret / access tokens  
3. Branding + Web client creation = **open + user click** (no Playwright ToS)  
4. Management API only after user provides Client ID/Secret (or env)  
5. Do not invent OAuth Admin API create-client workarounds (deprecated)  
6. Web client is required for Expo `signInWithOAuth` browser flow  

## Additional resources

- [api-constraints.md](api-constraints.md)  
- [handoffs.md](handoffs.md)  
- [examples.md](examples.md)  
- [scaffold.md](scaffold.md)  
