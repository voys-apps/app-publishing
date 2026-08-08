# Auth Launchpad — API constraints

## Google Cloud

- **OAuth branding / Web client create:** Console only (Google Auth Platform).  
  IAP OAuth Admin API for brands/clients is **deprecated** — do not rely on it.
- Owner SA can still enable related GCP APIs via Service Usage.
- Never store Client Secret in git.

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
