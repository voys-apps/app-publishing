# Auth Launchpad — click handoffs

Agent **opens** these URLs and prints the bullets; **user** clicks/fills.

## Google Auth Platform (`?project=PROJECT_ID`)

| Page | URL | User clicks / fills |
| --- | --- | --- |
| Overview | `https://console.cloud.google.com/auth/overview?project={id}` | Orient |
| Branding | `https://console.cloud.google.com/auth/branding?project={id}` | App name **QuickDoc**, support email, logo, home/privacy/terms links → Save → Verify/Publish when ready |
| Audience | `https://console.cloud.google.com/auth/audience?project={id}` | **External** (consumer app) |
| Scopes | `https://console.cloud.google.com/auth/scopes?project={id}` | Ensure `openid`, `…/userinfo.email`, `…/userinfo.profile` |
| Clients | `https://console.cloud.google.com/auth/clients?project={id}` | **Create client** |
| Create Web client | `https://console.cloud.google.com/auth/clients/create?project={id}` | Type **Web application**; redirect URI `https://{ref}.supabase.co/auth/v1/callback`; copy ID + secret |

### Branding field suggestions (example app)

- App name: `{APP_DISPLAY_NAME}`
- Support email: Google account that owns the Cloud project (user must pick in Console)
- App domain / home: `https://voysapps.io/app/{slug}`
- Privacy: `https://voysapps.io/app/{slug}/privacy-policy`
- Terms: `https://voysapps.io/app/{slug}/terms-of-use`

Logo: use Play/store icon ≥120×120; brand verification may take days — login works before verification (name/logo may not show).

## Supabase Dashboard

| Page | URL | User action |
| --- | --- | --- |
| Google provider | `https://supabase.com/dashboard/project/{ref}/auth/providers` | Enable Google; paste Client ID + Secret (if no Management token) |
| URL config | `https://supabase.com/dashboard/project/{ref}/auth/url-configuration` | Add `{scheme}://auth/oauth-callback` (+ Expo go/dev URLs if needed) |
| Access token | `https://supabase.com/dashboard/account/tokens` | Create PAT → `SUPABASE_ACCESS_TOKEN` for `pnpm auth:google:apply` |

## Branding API note (important)

Branding **can** be created via API (`iap.googleapis.com` `projects.brands.create`) when the
GCP project is under a Cloud **Organization**. Standalone / no-org projects return
`Project must belong to an organization`.

Even when the API works:

- Only `applicationTitle` + `supportEmail` (not logo / privacy links)
- Brand starts **Internal** — set External in Console for public Sign-In
- Supabase still needs a **Web** OAuth client created in Auth Platform (IAP API clients cannot set Supabase redirect URIs)

**Unblock options:** (1) move the GCP project into a Google Cloud Organization, then retry brand API; or (2) finish Branding + Web client in Console (pages opened by `pnpm console:open`).

## After user finishes Web client

```bash
export GOOGLE_OAUTH_CLIENT_ID=…
export GOOGLE_OAUTH_CLIENT_SECRET=…
export SUPABASE_ACCESS_TOKEN=…
pnpm auth:google:apply
pnpm auth:google:status
```
