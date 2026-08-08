# Auth Launchpad — examples

## Example A — First-time Google Sign-In

User: “Google sign-in Supabase’e bağla, branding yap”

1. `pnpm console:open` — branding, clients, supabase providers  
2. User fills branding + creates Web client with Supabase callback  
3. User pastes ID/secret into env or chat (warn: prefer env)  
4. `pnpm auth:google:apply` if `SUPABASE_ACCESS_TOKEN` set; else user pastes in Dashboard  
5. Confirm redirects include app scheme  
6. Test on device

## Example B — No Management token

→ Open Providers page; user enables Google and pastes credentials.  
Agent still opens Google branding/clients pages.

## Example C — MCP needsAuth

→ Do not block on MCP. Use PAT scripts or Dashboard handoff.

## Example D — Wrong client type

User created only Android client → Expo browser OAuth fails.  
Create **Web application** client; put that ID/secret in Supabase.
