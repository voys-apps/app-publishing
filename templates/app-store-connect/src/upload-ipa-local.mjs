/**
 * Upload a local .ipa to App Store Connect / TestFlight via xcrun altool + ASC API key.
 * No Apple ID login or EAS Submit required.
 *
 * Usage:
 *   pnpm ipa:upload -- --ipa=../../slide-ai-1.1.0-6.ipa
 *   pnpm ipa:upload -- --ipa=./app.ipa --validate-only
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { getConfig, resolvePrivateKeyPem } from './client.mjs'

const VALIDATE_ONLY = process.argv.includes('--validate-only')

function argValue(prefix, fallback) {
  const hit = process.argv.find(a => a.startsWith(prefix))
  return hit ? hit.slice(prefix.length) : fallback
}

function writeTempP8() {
  const pem = resolvePrivateKeyPem()
  const tmp = path.join('/tmp', `asc-upload-${process.pid}.p8`)
  fs.writeFileSync(tmp, pem, { mode: 0o600 })
  return tmp
}

function runAltool(mode, ipaPath, keyId, issuerId, p8Path) {
  const args = [
    mode === 'validate' ? '--validate-app' : '--upload-app',
    '-f',
    ipaPath,
    '--apiKey',
    keyId,
    '--apiIssuer',
    issuerId,
    '--p8-file-path',
    p8Path
  ]

  const result = spawnSync('xcrun', ['altool', ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  })

  const output = `${result.stdout || ''}${result.stderr || ''}`.trim()
  if (result.status !== 0) {
    const err = new Error(`altool ${mode} failed (exit ${result.status})`)
    err.output = output
    throw err
  }
  return output
}

async function main() {
  const cfg = getConfig()
  const ipa = argValue('--ipa=', process.env.ASC_IPA_PATH || '')
  if (!ipa) {
    throw new Error('Missing --ipa=/path/to/app.ipa (or ASC_IPA_PATH)')
  }

  const ipaPath = path.resolve(ipa)
  if (!fs.existsSync(ipaPath)) {
    throw new Error(`IPA not found: ${ipaPath}`)
  }
  if (!ipaPath.endsWith('.ipa')) {
    throw new Error(`Expected .ipa file: ${ipaPath}`)
  }

  const p8Path = writeTempP8()
  try {
    console.log(`IPA: ${ipaPath}`)
    console.log(`Key: ${cfg.keyId}`)
    console.log(`Issuer: ${cfg.issuerId}`)
    console.log(`Mode: ${VALIDATE_ONLY ? 'validate' : 'upload'}`)

    const output = runAltool(
      VALIDATE_ONLY ? 'validate' : 'upload',
      ipaPath,
      cfg.keyId,
      cfg.issuerId,
      p8Path
    )
    console.log(output)
    if (!VALIDATE_ONLY) {
      console.log('Upload complete. Build appears in TestFlight after Apple processing (~5–15 min).')
    }
  } finally {
    fs.rmSync(p8Path, { force: true })
  }
}

main().catch(err => {
  if (err.output) console.error(err.output)
  console.error(err.message || err)
  process.exit(1)
})
