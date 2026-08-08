import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  APP_SCHEME,
  SUPABASE_PROJECT_REF,
  appOAuthCallback,
  supabaseCallbackUrl,
} from './catalog.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

function loadGoogleCreds() {
  const id = process.env.GOOGLE_OAUTH_CLIENT_ID
  const secret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  if (id && secret) return { client_id: id, client_secret: secret }

  const file = path.join(ROOT, 'secrets/google-oauth-web.json')
  if (fs.existsSync(file)) {
    const j = JSON.parse(fs.readFileSync(file, 'utf8'))
    if (j.client_id && j.client_secret) return j
  }
  throw new Error(
    'Set GOOGLE_OAUTH_CLIENT_ID + GOOGLE_OAUTH_CLIENT_SECRET or secrets/google-oauth-web.json',
  )
}

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN
  const ref = process.env.SUPABASE_PROJECT_REF || SUPABASE_PROJECT_REF
  if (!token) {
    throw new Error('Missing SUPABASE_ACCESS_TOKEN')
  }

  const { client_id, client_secret } = loadGoogleCreds()
  const additional = process.env.GOOGLE_OAUTH_ADDITIONAL_CLIENT_IDS || ''

  const body = {
    external_google_enabled: true,
    external_google_client_id: client_id,
    external_google_secret: client_secret,
  }
  if (additional.trim()) {
    body.external_google_additional_client_ids = additional.trim()
  }

  // Best-effort redirect allow list fields (API may ignore unknown keys)
  const appCb = appOAuthCallback(process.env.APP_SCHEME || APP_SCHEME)
  if (process.env.AUTH_PATCH_REDIRECTS === '1') {
    body.uri_allow_list = appCb
  }

  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('PATCH failed', res.status, JSON.stringify(json).slice(0, 800))
    process.exitCode = 1
    return
  }

  console.log('✓ Google provider enabled on', ref)
  console.log('client_id:', `${client_id.slice(0, 28)}…`)
  console.log('Ensure Google Console redirect URI includes:', supabaseCallbackUrl(ref))
  console.log('Ensure Supabase URL allow-list includes:', appCb)
  console.log('(Dashboard URL Configuration if not patched)')
}

main().catch((e) => {
  console.error(e.message || e)
  process.exitCode = 1
})
