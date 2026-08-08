# Auth Launchpad — API constraints

## Google Cloud — OAuth branding (researched)

### What exists

There **is** a REST API for OAuth **brands** (consent screen name + support email):

- `POST https://iap.googleapis.com/v1/projects/{projectId}/brands`
- Body: `{ "applicationTitle": "QuickDoc", "supportEmail": "you@…" }`
- Docs: [projects.brands.create](https://cloud.google.com/iap/docs/reference/rest/v1/projects.brands/create)
- Also: `gcloud iap oauth-brands create …`

### Hard limits of that API (why agents often “can’t”)

| Limit | Impact for Voys / Supabase apps |
| --- | --- |
| **GCP project must belong to an Organization** | Standalone projects (no org parent) → `400 Project must belong to an organization.` |
| Brand created as **`orgInternalOnly: true`** | Consumer Google Sign-In needs **External** audience — change in Console |
| `supportEmail` must be owned by the **caller** | SA email is invalid; use a user email or a Google Group owned by the SA |
| Brand resource = title + support email only | **Logo, privacy/terms URLs, brand verification/publish** → Google Auth Platform Console |
| IAP `oauth-clients.create` clients are **locked for IAP** | Cannot set Supabase `…/auth/v1/callback` redirect → **Web client for Supabase still Console** |
| IAP OAuth Admin path is **deprecated** (shutdown ~Mar 2026) | Prefer Console Auth Platform for new production apps; API may vanish |

### Voys agent policy

1. Try `brands.create` when project is under an **Organization** and a valid `supportEmail` is known.  
2. If `Project must belong to an organization` → tell user to move the GCP project into a Cloud Org (or create branding in Console).  
3. Always open Auth Platform Branding / Clients for logo + External + Web client (Supabase).  
4. Do **not** claim full consent-screen branding (logo/links/verified) was done via API.

### Enable API first

`iap.googleapis.com` via Service Usage (Owner SA).

## Supabase Management API

Base: `https://api.supabase.com/v1`

Auth: `Authorization: Bearer {SUPABASE_ACCESS_TOKEN}` (Personal Access Token).

| Action | Call |
| --- | --- |
| Get auth config | `GET /projects/{ref}/config/auth` |
| Enable Google | `PATCH /projects/{ref}/config/auth` body below |

```json
{
  "external_google_enabled": true,
  "external_google_client_id": "<web-client-id>",
  "external_google_secret": "<web-client-secret>"
}
```

Optional: `external_google_additional_client_ids` = comma-separated Android/iOS client IDs.

Redirect URIs (also PATCHable via related auth URI fields when supported, or Dashboard URL Configuration):

- App: `{scheme}://auth/oauth-callback`
- Always keep: `https://{ref}.supabase.co/auth/v1/callback` on **Google** Authorized redirect URIs

## Expo / Voys traps

- Browser OAuth (`signInWithOAuth` + `WebBrowser`) needs **Web** client in Supabase, not only Android/iOS.
- Missing redirect in Supabase URL allow-list → `OAuth URL missing` / bounce fail.
- Anonymous disabled → guest → link flows break.
- MCP `user-supabase` may need `mcp_auth` — fall back to PAT + scripts.

## Do not

- Playwright-fill Google branding ToS as default  
- Commit `GOCSPX-…` secrets  
- Claim Google provider enabled without `auth:google:status` or Dashboard confirm  
