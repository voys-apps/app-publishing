import { spawnSync } from 'node:child_process'
import {
  APP_DISPLAY_NAME,
  APP_SCHEME,
  GCP_PROJECT_ID,
  HOME_URL,
  PRIVACY_URL,
  SUPABASE_PROJECT_REF,
  appOAuthCallback,
  supabaseCallbackUrl,
} from './catalog.mjs'

function openUrl(url) {
  const cmd = process.platform === 'darwin' ? 'open' : 'xdg-open'
  spawnSync(cmd, [url], { stdio: 'ignore' })
  console.log('opened:', url)
}

const projectId = process.env.GCP_PROJECT_ID || GCP_PROJECT_ID
const ref = process.env.SUPABASE_PROJECT_REF || SUPABASE_PROJECT_REF
const only = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1]

const pages = {
  branding: {
    url: `https://console.cloud.google.com/auth/branding?project=${projectId}`,
    click: [
      `App name: ${APP_DISPLAY_NAME}`,
      'Support email: your Google user / support@…',
      `Home: ${HOME_URL}`,
      `Privacy: ${PRIVACY_URL}`,
      'Upload logo → Save → Verify/Publish when offered',
    ],
  },
  audience: {
    url: `https://console.cloud.google.com/auth/audience?project=${projectId}`,
    click: ['User type: External (consumer apps)'],
  },
  scopes: {
    url: `https://console.cloud.google.com/auth/scopes?project=${projectId}`,
    click: ['Ensure openid + userinfo.email + userinfo.profile'],
  },
  clients: {
    url: `https://console.cloud.google.com/auth/clients/create?project=${projectId}`,
    click: [
      'Application type: Web application',
      `Authorized redirect URI: ${supabaseCallbackUrl(ref)}`,
      'Create → copy Client ID + Client Secret (store in env, never git)',
    ],
  },
  supabaseProviders: {
    url: `https://supabase.com/dashboard/project/${ref}/auth/providers`,
    click: [
      'Google → Enable',
      'Paste Client ID + Secret (or use pnpm auth:google:apply with PAT)',
    ],
  },
  supabaseUrls: {
    url: `https://supabase.com/dashboard/project/${ref}/auth/url-configuration`,
    click: [
      `Add redirect: ${appOAuthCallback(APP_SCHEME)}`,
      'Save',
    ],
  },
  supabaseToken: {
    url: 'https://supabase.com/dashboard/account/tokens',
    click: ['Generate Personal Access Token → export SUPABASE_ACCESS_TOKEN'],
  },
}

const keys = only
  ? [only]
  : ['branding', 'audience', 'scopes', 'clients', 'supabaseProviders', 'supabaseUrls']

function main() {
  console.log('Auth handoff — agent opens; YOU click/fill.\n')
  console.log('Supabase callback (for Google client):', supabaseCallbackUrl(ref))
  console.log('App callback (Supabase allow-list):', appOAuthCallback(APP_SCHEME))
  console.log('')

  for (const k of keys) {
    const page = pages[k]
    if (!page) {
      console.error('Unknown --only=', k, 'options:', Object.keys(pages).join(', '))
      process.exitCode = 1
      return
    }
    console.log(`## ${k}`)
    for (const step of page.click) console.log(`  • ${step}`)
    openUrl(page.url)
    console.log('')
  }
}

main()
