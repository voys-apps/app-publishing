import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SignJWT, importPKCS8 } from 'jose'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const ROOT = path.resolve(__dirname, '..')
export const ASC_BASE = 'https://api.appstoreconnect.apple.com'

/**
 * Resolve ASC private key PEM (never commit).
 *
 * Priority:
 * 1. ASC_PRIVATE_KEY (PEM string — EAS secret / env:pull)
 * 2. ASC_PRIVATE_KEY_PATH
 * 3. First secrets/AuthKey_*.p8
 * 4. secrets/AuthKey.p8
 */
export function resolvePrivateKeyPem() {
  const inline = process.env.ASC_PRIVATE_KEY?.trim()
  if (inline?.includes('BEGIN PRIVATE KEY')) return inline

  const fromEnv = process.env.ASC_PRIVATE_KEY_PATH
  if (fromEnv) {
    const abs = path.resolve(fromEnv)
    if (fs.existsSync(abs)) return fs.readFileSync(abs, 'utf8')
    throw new Error(`ASC_PRIVATE_KEY_PATH not found: ${abs}`)
  }

  const secretsDir = path.join(ROOT, 'secrets')
  if (fs.existsSync(secretsDir)) {
    const named = fs
      .readdirSync(secretsDir)
      .filter((f) => /^AuthKey_.*\.p8$/i.test(f) || f === 'AuthKey.p8')
      .sort()
    if (named.length) {
      return fs.readFileSync(path.join(secretsDir, named[0]), 'utf8')
    }
  }

  throw new Error(
    [
      'App Store Connect .p8 bulunamadı.',
      '',
      'Key’i şuraya koy (gitignore’lu):',
      `  ${path.join(ROOT, 'secrets', 'AuthKey_XXXXXXXXXX.p8')}`,
      '',
      'veya:',
      '  export ASC_PRIVATE_KEY_PATH="/path/to/AuthKey_XXXXXXXXXX.p8"',
      '  export ASC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n..."',
      '',
      'Ayrıca ASC_ISSUER_ID ve ASC_KEY_ID gerekli.',
      'Kurulum: secrets/README.md + skill apc-launchpad'
    ].join('\n')
  )
}

/** @deprecated use resolvePrivateKeyPem */
export function resolvePrivateKeyPath() {
  const fromEnv = process.env.ASC_PRIVATE_KEY_PATH
  if (fromEnv) return path.resolve(fromEnv)
  const secretsDir = path.join(ROOT, 'secrets')
  if (fs.existsSync(secretsDir)) {
    const named = fs
      .readdirSync(secretsDir)
      .filter((f) => /^AuthKey_.*\.p8$/i.test(f) || f === 'AuthKey.p8')
      .sort()
    if (named.length) return path.join(secretsDir, named[0])
  }
  return '(inline ASC_PRIVATE_KEY or missing)'
}

export function getConfig() {
  const issuerId = process.env.ASC_ISSUER_ID?.trim()
  const keyId = process.env.ASC_KEY_ID?.trim()
  const bundleId =
    process.env.ASC_BUNDLE_ID?.trim() || process.env.BUNDLE_ID?.trim()
  const appAppleId = process.env.ASC_APP_APPLE_ID?.trim()
  const version = process.env.ASC_VERSION?.trim()
  const teamId = process.env.ASC_TEAM_ID?.trim()

  if (!issuerId) {
    throw new Error('ASC_ISSUER_ID eksik (Integrations → Issuer ID UUID).')
  }
  if (!keyId) {
    throw new Error('ASC_KEY_ID eksik (API Key ID).')
  }

  return {
    issuerId,
    keyId,
    bundleId,
    appAppleId,
    version,
    teamId,
    privateKeyPath: resolvePrivateKeyPath()
  }
}

let cachedToken = null
let cachedTokenExp = 0

export async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && cachedTokenExp - 30 > now) return cachedToken

  const { issuerId, keyId } = getConfig()
  const pem = resolvePrivateKeyPem()
  const key = await importPKCS8(pem, 'ES256')
  const exp = now + 20 * 60

  cachedToken = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId, typ: 'JWT' })
    .setIssuer(issuerId)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .setAudience('appstoreconnect-v1')
    .sign(key)

  cachedTokenExp = exp
  return cachedToken
}

/**
 * @param {string} apiPath - absolute path starting with /v1/...
 * @param {{ method?: string, body?: unknown, query?: Record<string, string|undefined> }} [opts]
 */
export async function ascFetch(apiPath, opts = {}) {
  const method = opts.method || 'GET'
  const url = new URL(apiPath.startsWith('http') ? apiPath : `${ASC_BASE}${apiPath}`)
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v != null && v !== '') url.searchParams.set(k, v)
    }
  }

  const token = await getAccessToken()
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json'
  }
  if (opts.body != null) headers['Content-Type'] = 'application/json'

  const res = await fetch(url, {
    method,
    headers,
    body: opts.body != null ? JSON.stringify(opts.body) : undefined
  })

  const text = await res.text()
  let json = null
  if (text) {
    try {
      json = JSON.parse(text)
    } catch {
      json = { raw: text }
    }
  }

  if (!res.ok) {
    const err = new Error(`ASC ${method} ${url.pathname} → ${res.status}`)
    err.status = res.status
    err.body = json
    throw err
  }

  return json
}

export function formatApiError(err) {
  if (err?.body) return JSON.stringify(err.body, null, 2)
  return err?.message || String(err)
}

export function codePointLength(s) {
  return [...String(s ?? '')].length
}
