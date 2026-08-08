# Human click handoffs

**Contract for all Voys publishing skills:** when a step cannot be done by API,
the **agent opens the Console URL** (`open` / `pnpm console:open`) and prints
the click checklist; the **user clicks / pastes / uploads**. Agents do **not**
Playwright/CDP-click ToS, Enable, or paste secrets as the default path.

After the user confirms, the agent **verifies** via API (`analytics:status`,
`get-product-store-state`, etc.).

## firebase-launchpad

| # | Open URL | User action | Verify |
| --- | --- | --- | --- |
| 1 | `…/project/{id}/settings/integrations` | Google Analytics → **Enable** / Link → accept ToS → create/select GA4 property | `pnpm analytics:status` |
| 2 | `…/analytics/app/android:{package}/overview` | If still shown: **Enable Google Analytics** | same |
| 3 | `…/analytics/app/ios:{bundle}/overview` | Confirm dashboard (no Enable CTA) | same |
| 4 | `…/project/{id}/settings/cloudmessaging` | Upload APNs `.p8` + Key ID + Team ID (iOS push) | send test / device token |

```bash
cd scripts/firebase
pnpm console:open
pnpm console:open -- --only=integrations
pnpm analytics:status -- --open
```

## play-launchpad (Console-only)

| # | Open URL | User action | Verify |
| --- | --- | --- | --- |
| 1 | Play → Users and permissions | Invite SA email if 403 | `pnpm auth:check` |
| 2 | Play → Monetize → Monetization setup | Paste RTDN Pub/Sub topic → Save → Send test notification | RC “Last received” / Play test OK |
| 3 | Play → first publish / Start rollout | When API returns draft-app blocker | track status in API |

Agent: print topic ID + open Monetization setup deep link when possible; user pastes.

## rc-forge (Dashboard-only)

| # | Open URL | User action | Verify |
| --- | --- | --- | --- |
| 1 | RC → Project → Play app → Service credentials | Paste/upload Play SA JSON → Save | `get-product-store-state` / no “Missing credentials” |
| 2 | RC → Play app → Connect to Google / Pub/Sub | Pick topic if listed | Last received |
| 3 | (optional) Paywall builder | Visual QA only | MCP `render-paywall-screenshot` |

Agent: `open` app settings URL + `pbcopy` SA JSON when helpful; user pastes + Saves.

## auth-launchpad (Google / Supabase)

| # | Open URL | User action | Verify |
| --- | --- | --- | --- |
| 1 | Google Auth → Branding | App name, logo, support email, privacy/home | Visual consent screen |
| 2 | Google Auth → Create Web client | Redirect `https://{ref}.supabase.co/auth/v1/callback` | Copy ID + secret |
| 3 | Supabase → Auth → Providers | Enable Google + paste secrets (or `pnpm auth:google:apply`) | `pnpm auth:google:status` |
| 4 | Supabase → URL Configuration | Add `{scheme}://auth/oauth-callback` | Device OAuth test |

See [../auth-launchpad/handoffs.md](../auth-launchpad/handoffs.md).

## admob-launchpad

| # | Open URL | User action | Verify |
| --- | --- | --- | --- |
| 1 | `https://apps.admob.com/v2/apps/list` | Confirm account (already signed in) | — |
| 2 | `https://apps.admob.com/v2/apps/create` | Android + iOS + ad units; paste IDs | `EXPO_PUBLIC_ADMOB_*` in env |

```bash
cd scripts/admob && CHROME_PROFILE_DIRECTORY="Profile 4" pnpm console:open
```

See [../admob-launchpad/handoffs.md](../admob-launchpad/handoffs.md).

## Shared rules

1. Always list **what to click** in the chat (bullets), not only a bare URL  
2. Prefer `pnpm` for all script commands in skills/templates  
3. Never claim a click-handoff step was completed without user confirmation or API verify  
4. Do not invent alternate upload APIs for Console-only surfaces  
