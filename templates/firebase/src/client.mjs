import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { google } from 'googleapis'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const FIREBASE_APIS = [
  'firebase.googleapis.com',
  'fcm.googleapis.com',
  'fcmregistrations.googleapis.com',
  'firebaseinstallations.googleapis.com',
  'analytics.googleapis.com',
  'analyticsadmin.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'cloudresourcemanager.googleapis.com',
  'serviceusage.googleapis.com',
]

/**
 * Resolve SA JSON: Firebase-specific → Play shared → ADC → local secrets.
 */
export function resolveCredentialsPath() {
  const candidates = [
    process.env.GOOGLE_FIREBASE_SERVICE_ACCOUNT_JSON,
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON,
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.join(ROOT, 'secrets/firebase-service-account.json'),
    path.join(ROOT, 'secrets/play-api-service-account.json'),
  ].filter(Boolean)

  for (const p of candidates) {
    const abs = path.isAbsolute(p) ? p : path.resolve(process.cwd(), p)
    if (fs.existsSync(abs)) return abs
  }
  throw new Error(
    [
      'Firebase service account JSON bulunamadı.',
      'Set GOOGLE_FIREBASE_SERVICE_ACCOUNT_JSON or place',
      'secrets/firebase-service-account.json (Owner on target GCP).',
    ].join(' '),
  )
}

export function loadServiceAccount() {
  const keyFile = resolveCredentialsPath()
  const key = JSON.parse(fs.readFileSync(keyFile, 'utf8'))
  return { keyFile, key, projectIdFromKey: key.project_id }
}

export async function getAuthClient() {
  const { keyFile, key } = loadServiceAccount()
  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/firebase',
      'https://www.googleapis.com/auth/analytics.edit',
    ],
  })
  const client = await auth.getClient()
  return { auth, client, keyFile, key }
}

export async function firebaseFetch(client, method, apiPath, body) {
  const token = (await client.getAccessToken()).token
  const res = await fetch(`https://firebase.googleapis.com/v1beta1/${apiPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    json = { raw: text }
  }
  return { status: res.status, json }
}

export async function pollOperation(client, operationName, label = 'operation') {
  const start = Date.now()
  while (Date.now() - start < 180_000) {
    const { status, json } = await firebaseFetch(client, 'GET', operationName)
    if (status >= 400) {
      throw new Error(`${label} poll HTTP ${status}: ${JSON.stringify(json).slice(0, 400)}`)
    }
    if (json.done) {
      if (json.error) throw new Error(`${label} failed: ${JSON.stringify(json.error)}`)
      return json.response || json
    }
    await new Promise((r) => setTimeout(r, 2500))
  }
  throw new Error(`${label} timed out`)
}

export async function enableFirebaseApis(projectId, auth) {
  const serviceusage = google.serviceusage({ version: 'v1', auth })
  for (const api of FIREBASE_APIS) {
    const name = `projects/${projectId}/services/${api}`
    try {
      const get = await serviceusage.services.get({ name })
      if (get.data.state === 'ENABLED') {
        console.log(`✓ API already enabled: ${api}`)
        continue
      }
    } catch {
      // enable below
    }
    try {
      await serviceusage.services.enable({ name })
      console.log(`✓ Enabled ${api}`)
    } catch (err) {
      console.warn(`⚠ Could not enable ${api}: ${err.message?.slice(0, 160) || err}`)
    }
  }
}

export function formatApiError(err) {
  if (!err) return 'unknown error'
  if (typeof err === 'string') return err
  return err.message || JSON.stringify(err)
}
