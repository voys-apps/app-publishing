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

### Branding field suggestions (QuickDoc)

- App name: `QuickDoc`
- Support email: team Google account / `support@voysapps.io` (if owned)
- App domain / home: `https://voysapps.io/quickdoc` (or real marketing URL)
- Privacy: `https://voysapps.io/quickdoc/privacy-policy` (match store listing)
- Terms: `https://voysapps.io/quickdoc/terms` if available

Logo: use Play/store icon ≥120×120; brand verification may take days — login works before verification (name/logo may not show).

## Supabase Dashboard

| Page | URL | User action |
| --- | --- | --- |
| Google provider | `https://supabase.com/dashboard/project/{ref}/auth/providers` | Enable Google; paste Client ID + Secret (if no Management token) |
| URL config | `https://supabase.com/dashboard/project/{ref}/auth/url-configuration` | Add `{scheme}://auth/oauth-callback` (+ Expo go/dev URLs if needed) |
| Access token | `https://supabase.com/dashboard/account/tokens` | Create PAT → `SUPABASE_ACCESS_TOKEN` for `pnpm auth:google:apply` |

## After user finishes Web client

```bash
export GOOGLE_OAUTH_CLIENT_ID=…
export GOOGLE_OAUTH_CLIENT_SECRET=…
export SUPABASE_ACCESS_TOKEN=…
pnpm auth:google:apply
pnpm auth:google:status
```
