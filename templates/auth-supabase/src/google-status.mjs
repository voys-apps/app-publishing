import {
  SUPABASE_PROJECT_REF,
  supabaseCallbackUrl,
} from './catalog.mjs'

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN
  const ref = process.env.SUPABASE_PROJECT_REF || SUPABASE_PROJECT_REF
  if (!token) {
    console.error('Missing SUPABASE_ACCESS_TOKEN — open https://supabase.com/dashboard/account/tokens')
    console.error('Or paste Google creds in Dashboard Providers (pnpm console:open -- --only=supabaseProviders)')
    process.exitCode = 2
    return
  }

  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('GET auth config failed', res.status, JSON.stringify(json).slice(0, 500))
    process.exitCode = 1
    return
  }

  console.log('project:', ref)
  console.log('callback:', supabaseCallbackUrl(ref))
  console.log('external_google_enabled:', json.external_google_enabled)
  console.log(
    'external_google_client_id:',
    json.external_google_client_id ? `${String(json.external_google_client_id).slice(0, 24)}…` : null,
  )
  console.log('external_google_secret set:', Boolean(json.external_google_secret))
  if (!json.external_google_enabled) process.exitCode = 2
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
