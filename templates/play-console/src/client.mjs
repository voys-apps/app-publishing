import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { google } from 'googleapis'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

/**
 * Resolve service account JSON path (never commit this file).
 *
 * Priority:
 * 1. GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
 * 2. GOOGLE_APPLICATION_CREDENTIALS
 * 3. scripts/play-console/secrets/play-api-service-account.json
 */
export function resolveCredentialsPath() {
  const fromEnv =
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS

  const candidates = [
    fromEnv,
    path.join(ROOT, 'secrets', 'play-api-service-account.json')
  ].filter(Boolean)

  for (const p of candidates) {
    const abs = path.resolve(p)
    if (fs.existsSync(abs)) return abs
  }

  throw new Error(
    [
      'Play service account JSON bulunamadı.',
      '',
      'Key’i şuraya koy (gitignore’lu):',
      `  ${path.join(ROOT, 'secrets', 'play-api-service-account.json')}`,
      '',
      'veya:',
      '  export GOOGLE_PLAY_SERVICE_ACCOUNT_JSON="/path/to/key.json"',
      '',
      'Kurulum: docs/subscription/PLAY_ANDROID_PUBLISHER_API.md'
    ].join('\n')
  )
}

export async function getAndroidPublisher() {
  const keyFile = resolveCredentialsPath()
  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/androidpublisher']
  })
  const authClient = await auth.getClient()
  const androidpublisher = google.androidpublisher({
    version: 'v3',
    auth: authClient
  })
  return { androidpublisher, keyFile }
}

export function formatApiError(err) {
  const data = err?.response?.data
  if (data) return JSON.stringify(data, null, 2)
  return err?.message || String(err)
}
