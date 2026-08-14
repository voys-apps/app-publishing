/**
 * Upload a local IPA to App Store Connect via ASC REST (buildUploads).
 * Never uses eas submit. EAS is build-only (`pnpm build:ios --local`).
 *
 * Usage (app repo, env from .env.local):
 *   pnpm --dir scripts/app-store-connect ipa:upload -- --ipa=./build-*.ipa
 *   pnpm --dir scripts/app-store-connect ipa:upload -- --ipa=/abs/path.ipa --version=1.0.0 --build=7
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { ascFetch, formatApiError, getConfig, resolvePrivateKeyPath } from './client.mjs'
import { resolveApp } from './resolve-app.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_ROOT = path.resolve(__dirname, '../../..')

function loadDotEnvLocal() {
  const p = path.join(APP_ROOT, '.env.local')
  if (!fs.existsSync(p)) return
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    const k = t.slice(0, i).trim()
    let v = t.slice(i + 1).trim()
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1)
    }
    if (k && process.env[k] == null) process.env[k] = v
  }
}

function argValue(prefix, fallback = '') {
  const hit = process.argv.find((a) => a.startsWith(prefix))
  return hit ? hit.slice(prefix.length) : fallback
}

function hasFlag(name) {
  return process.argv.includes(name)
}

function checksumsOf(buf) {
  const sha256hex = crypto.createHash('sha256').update(buf).digest('hex')
  const sha256b64 = crypto.createHash('sha256').update(buf).digest('base64')
  const md5hex = crypto.createHash('md5').update(buf).digest('hex')
  const md5b64 = crypto.createHash('md5').update(buf).digest('base64')
  return [
    {
      file: { hash: sha256hex, algorithm: 'SHA256' },
      composite: { hash: md5hex, algorithm: 'MD5' }
    },
    {
      file: { hash: sha256b64, algorithm: 'SHA256' },
      composite: { hash: md5b64, algorithm: 'MD5' }
    },
    { file: { hash: sha256hex, algorithm: 'SHA256' } },
    { composite: { hash: md5hex, algorithm: 'MD5' } }
  ]
}

async function commitUploadFile(fileId, buf) {
  try {
    await ascFetch(`/v1/buildUploadFiles/${fileId}`, {
      method: 'PATCH',
      body: {
        data: {
          type: 'buildUploadFiles',
          id: fileId,
          attributes: { uploaded: true }
        }
      }
    })
    console.log('✓ PATCH uploaded=true')
    return
  } catch (err) {
    if (err.status !== 409 && err.status !== 422) throw err
    console.warn('uploaded=true alone rejected; retrying with checksums')
  }

  let lastErr = null
  for (const sourceFileChecksums of checksumsOf(buf)) {
    try {
      await ascFetch(`/v1/buildUploadFiles/${fileId}`, {
        method: 'PATCH',
        body: {
          data: {
            type: 'buildUploadFiles',
            id: fileId,
            attributes: { uploaded: true, sourceFileChecksums }
          }
        }
      })
      console.log('✓ PATCH uploaded=true + checksums')
      return
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr || new Error('Could not commit buildUploadFile')
}

function findLatestIpa() {
  const names = fs
    .readdirSync(APP_ROOT)
    .filter((f) => f.toLowerCase().endsWith('.ipa'))
  if (!names.length) return ''
  const ranked = names
    .map((name) => {
      const p = path.join(APP_ROOT, name)
      return { p, mtime: fs.statSync(p).mtimeMs }
    })
    .sort((a, b) => b.mtime - a.mtime)
  return ranked[0].p
}

function resolveIpaPath(ipaArg) {
  if (!ipaArg) return findLatestIpa()
  if (path.isAbsolute(ipaArg) && fs.existsSync(ipaArg)) return ipaArg
  const fromCwd = path.resolve(ipaArg)
  if (fs.existsSync(fromCwd)) return fromCwd
  const fromRoot = path.resolve(APP_ROOT, ipaArg)
  if (fs.existsSync(fromRoot)) return fromRoot
  return ipaArg
}

function readIpaVersions(ipaPath) {
  let listing = ''
  try {
    listing = execFileSync('zipinfo', ['-1', ipaPath], {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024
    })
  } catch {
    return { version: '', build: '' }
  }
  const plistPath = listing
    .split('\n')
    .map((s) => s.trim())
    .find(
      (s) =>
        /^Payload\/[^/]+\.app\/Info\.plist$/i.test(s) &&
        !s.includes('.appex/') &&
        !s.toLowerCase().includes('watch')
    )
  if (!plistPath) return { version: '', build: '' }

  const raw = execFileSync('unzip', ['-p', ipaPath, plistPath], {
    maxBuffer: 5 * 1024 * 1024
  })
  const tmpDir = fs.mkdtempSync(path.join(path.dirname(ipaPath), '.ipa-plist-'))
  const tmp = path.join(tmpDir, 'Info.plist')
  fs.writeFileSync(tmp, raw)
  try {
    const json = execFileSync('plutil', ['-convert', 'json', '-o', '-', tmp], {
      encoding: 'utf8'
    })
    const info = JSON.parse(json)
    return {
      version: String(info.CFBundleShortVersionString || ''),
      build: String(info.CFBundleVersion || '')
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

function headersFromOps(requestHeaders) {
  const out = {}
  for (const h of requestHeaders || []) {
    if (h?.name && h.value != null) out[h.name] = h.value
  }
  return out
}

async function putOperations(buf, operations) {
  const ops = [...(operations || [])].sort(
    (a, b) => Number(a.offset || 0) - Number(b.offset || 0)
  )
  if (!ops.length) throw new Error('No uploadOperations in BuildUploadFile response')

  for (const op of ops) {
    const offset = Number(op.offset || 0)
    const length = Number(op.length || buf.length)
    const chunk = buf.subarray(offset, offset + length)
    const method = (op.method || 'PUT').toUpperCase()
    let lastErr = null
    for (let attempt = 1; attempt <= 3; attempt++) {
      const res = await fetch(op.url, {
        method,
        headers: headersFromOps(op.requestHeaders),
        body: chunk
      })
      if (res.ok) {
        lastErr = null
        break
      }
      const text = await res.text().catch(() => '')
      lastErr = new Error(
        `Chunk PUT ${offset}+${length} → ${res.status} ${text.slice(0, 400)}`
      )
      await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)))
    }
    if (lastErr) throw lastErr
    console.log(`✓ uploaded bytes ${offset}–${offset + chunk.length}`)
  }
}

function nestedState(statusJson) {
  const raw = statusJson?.data?.attributes?.state
  if (raw && typeof raw === 'object') return raw.state || raw
  return raw
}

async function uploadViaRest({ buf, fileName, appId, version, build }) {
  console.log(`ASC REST upload: ${fileName} (${buf.length} bytes)`)
  console.log(`App ${appId}  version ${version}  build ${build}`)

  const created = await ascFetch('/v1/buildUploads', {
    method: 'POST',
    body: {
      data: {
        type: 'buildUploads',
        attributes: {
          cfBundleShortVersionString: version,
          cfBundleVersion: build,
          platform: 'IOS'
        },
        relationships: {
          app: { data: { type: 'apps', id: appId } }
        }
      }
    }
  })
  const uploadId = created.data?.id
  if (!uploadId) throw new Error('buildUploads create returned no id')
  console.log(`✓ buildUploads ${uploadId}`)

  const file = await ascFetch('/v1/buildUploadFiles', {
    method: 'POST',
    body: {
      data: {
        type: 'buildUploadFiles',
        attributes: {
          fileName,
          fileSize: buf.length,
          assetType: 'ASSET',
          uti: 'com.apple.ipa'
        },
        relationships: {
          buildUpload: { data: { type: 'buildUploads', id: uploadId } }
        }
      }
    }
  })
  const fileId = file.data?.id
  const operations = file.data?.attributes?.uploadOperations
  if (!fileId) throw new Error('buildUploadFiles create returned no id')
  console.log(`✓ buildUploadFiles ${fileId}`)

  await putOperations(buf, operations)
  await commitUploadFile(fileId, buf)

  const status = await ascFetch(`/v1/buildUploads/${uploadId}`)
  const state = nestedState(status)
  console.log(`Upload state: ${state || '(unknown)'}`)
  console.log(
    'Apple will process the build (often 5–30 min). Then it appears in TestFlight.'
  )
  return { uploadId, state }
}

function ensureAltoolKey() {
  const cfg = getConfig()
  const keyPath = resolvePrivateKeyPath()
  const keysDir = path.join(process.env.HOME || '', '.appstoreconnect', 'private_keys')
  fs.mkdirSync(keysDir, { recursive: true })
  const dest = path.join(keysDir, `AuthKey_${cfg.keyId}.p8`)
  if (typeof keyPath === 'string' && fs.existsSync(keyPath) && !fs.existsSync(dest)) {
    fs.copyFileSync(keyPath, dest)
  }
  return cfg
}

async function uploadViaAltool({ ipaPath, appId, version, build }) {
  const cfg = ensureAltoolKey()
  const args = [
    'altool',
    '--upload-package',
    ipaPath,
    '-t',
    'ios',
    '--apple-id',
    appId,
    '--bundle-id',
    cfg.bundleId || 'com.appsvoys.quickdoc',
    '--bundle-version',
    build,
    '--bundle-short-version-string',
    version,
    '--apiKey',
    cfg.keyId,
    '--apiIssuer',
    cfg.issuerId,
    '--output-format',
    'json'
  ]
  console.log('Using xcrun altool with the same ASC API key (not EAS submit)')
  execFileSync('xcrun', args, { stdio: 'inherit' })
}

async function main() {
  loadDotEnvLocal()
  const ipaArg = argValue('--ipa=', process.env.ASC_IPA_PATH || '')
  const ipaPath = resolveIpaPath(ipaArg)
  if (!ipaPath || !fs.existsSync(ipaPath) || !ipaPath.toLowerCase().endsWith('.ipa')) {
    throw new Error(
      'Missing IPA. Run local `pnpm build:ios`, then pass --ipa=/path/to/app.ipa'
    )
  }

  const fromIpa = readIpaVersions(ipaPath)
  const version =
    argValue('--version=', process.env.ASC_VERSION || '') || fromIpa.version || '1.0.0'
  const build =
    argValue('--build=', process.env.ASC_BUILD || '') || fromIpa.build
  if (!build) {
    throw new Error('Could not read CFBundleVersion from IPA — pass --build=')
  }

  const app = await resolveApp()
  const buf = fs.readFileSync(ipaPath)
  const fileName = path.basename(ipaPath)

  if (hasFlag('--altool')) {
    await uploadViaAltool({ ipaPath, appId: app.id, version, build })
    return
  }

  const fileId = argValue('--file-id=')
  const uploadId = argValue('--upload-id=')
  if (fileId) {
    console.log(`Resuming commit for buildUploadFiles ${fileId}`)
    await commitUploadFile(fileId, buf)
    const id = uploadId || fileId
    if (uploadId) {
      const status = await ascFetch(`/v1/buildUploads/${uploadId}`)
      console.log(`Upload state: ${nestedState(status) || '(unknown)'}`)
    }
    console.log(
      'Apple will process the build (often 5–30 min). Then it appears in TestFlight.'
    )
    return
  }

  try {
    await uploadViaRest({ buf, fileName, appId: app.id, version, build })
  } catch (err) {
    console.error(formatApiError(err))
    if (err.status === 404) {
      await uploadViaAltool({ ipaPath, appId: app.id, version, build })
      return
    }
    throw err
  }
}

main().catch((err) => {
  console.error(formatApiError(err))
  process.exit(1)
})
