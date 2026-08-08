import fs from 'node:fs'
import { google } from 'googleapis'
import { APP_DISPLAY_NAME, GCP_PROJECT_ID } from './catalog.mjs'

/**
 * Attempt IAP OAuth brand create (applicationTitle + supportEmail).
 * Requires: project under a GCP Organization; supportEmail owned by caller
 * (user email or Google Group owned by SA — not the SA email itself).
 *
 *   SUPPORT_EMAIL=you@gmail.com node src/brand-create.mjs
 */
async function main() {
  const keyFile =
    process.env.GOOGLE_FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (!keyFile || !fs.existsSync(keyFile)) {
    throw new Error('Set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON (Owner SA)')
  }
  const supportEmail = process.env.SUPPORT_EMAIL
  if (!supportEmail) {
    throw new Error('Set SUPPORT_EMAIL to a user address or Google Group owned by the caller')
  }

  const key = JSON.parse(fs.readFileSync(keyFile, 'utf8'))
  const projectId = process.env.GCP_PROJECT_ID || GCP_PROJECT_ID || key.project_id
  const title = process.env.APP_DISPLAY_NAME || APP_DISPLAY_NAME

  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  })
  const client = await auth.getClient()
  const serviceusage = google.serviceusage({ version: 'v1', auth: client })
  try {
    await serviceusage.services.enable({
      name: `projects/${projectId}/services/iap.googleapis.com`,
    })
  } catch {
    // may already be enabled
  }

  const token = (await client.getAccessToken()).token
  const list = await fetch(`https://iap.googleapis.com/v1/projects/${projectId}/brands`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const listJson = await list.json().catch(() => ({}))
  console.log('list brands', list.status, JSON.stringify(listJson).slice(0, 500))

  if (list.status === 200 && listJson.brands?.length) {
    console.log('✓ Brand already exists')
    console.log(listJson.brands[0])
    return
  }

  const res = await fetch(`https://iap.googleapis.com/v1/projects/${projectId}/brands`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      applicationTitle: title,
      supportEmail,
    }),
  })
  const json = await res.json().catch(() => ({}))
  console.log('create brand', res.status, JSON.stringify(json, null, 2).slice(0, 1200))

  if (res.status >= 400) {
    if (String(json?.error?.message || '').includes('organization')) {
      console.error(
        '\nBlocked: GCP project must belong to a Cloud Organization for brands.create.\n' +
          'Fix: Cloud Console → move project into an org, or complete Branding in Auth Platform UI.\n' +
          `UI: https://console.cloud.google.com/auth/branding?project=${projectId}`,
      )
    }
    process.exitCode = 1
    return
  }

  console.log('✓ Brand created (likely Internal). Set Audience → External in Console for consumer apps.')
  console.log('Logo/privacy/verify still: Auth Platform Branding UI.')
  console.log(`https://console.cloud.google.com/auth/branding?project=${projectId}`)
}

main().catch((e) => {
  console.error(e.message || e)
  process.exitCode = 1
})
