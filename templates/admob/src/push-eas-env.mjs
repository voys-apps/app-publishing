import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_ROOT = path.resolve(__dirname, '../../..')

const KEYS = [
  'EXPO_PUBLIC_ADMOB_ANDROID_APP_ID',
  'EXPO_PUBLIC_ADMOB_IOS_APP_ID',
  'EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID',
  'EXPO_PUBLIC_ADMOB_IOS_BANNER_ID',
  'EXPO_PUBLIC_ADMOB_ANDROID_NATIVE_ID',
  'EXPO_PUBLIC_ADMOB_IOS_NATIVE_ID',
  'EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID',
  'EXPO_PUBLIC_ADMOB_IOS_REWARDED_ID',
]

const ENVS = (process.env.EAS_ENVIRONMENTS || 'development,preview,production')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

function loadDotEnvLocal() {
  const p = path.join(APP_ROOT, '.env.local')
  if (!fs.existsSync(p)) return {}
  const out = {}
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
    out[k] = v
  }
  return out
}

function collect() {
  const file = loadDotEnvLocal()
  const pairs = []
  for (const k of KEYS) {
    const v = (process.env[k] || file[k] || '').trim()
    if (v) pairs.push([k, v])
  }
  return pairs
}

function easCreate(name, value) {
  const args = [
    'eas',
    'env:create',
    '--name',
    name,
    '--value',
    value,
    '--type',
    'string',
    '--visibility',
    'plaintext',
    '--force',
    '--non-interactive',
    ...ENVS.flatMap((e) => ['--environment', e]),
  ]
  const r = spawnSync('pnpm', ['exec', ...args], {
    cwd: APP_ROOT,
    encoding: 'utf8',
  })
  if (r.status !== 0) {
    console.error(r.stdout || '')
    console.error(r.stderr || '')
    throw new Error(`eas env:create failed for ${name}`)
  }
  console.log('✓ EAS', name, '→', ENVS.join(', '))
}

function main() {
  const pairs = collect()
  if (!pairs.length) {
    console.error(
      'No AdMob IDs found. Paste into .env.local or export EXPO_PUBLIC_ADMOB_* then retry.',
    )
    console.error('Keys:', KEYS.join(', '))
    process.exitCode = 1
    return
  }

  console.log('Pushing', pairs.length, 'vars to EAS environments:', ENVS.join(', '))
  for (const [k, v] of pairs) {
    console.log(' ', k, '=', v.slice(0, 24) + (v.length > 24 ? '…' : ''))
    easCreate(k, v)
  }
  console.log('\nDone. Rebuild native for App ID changes (Expo Ads plugin).')
}

main()
