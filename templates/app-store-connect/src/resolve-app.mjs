/**
 * Resolve ASC app by ASC_APP_APPLE_ID or ASC_BUNDLE_ID / catalog BUNDLE_ID.
 *
 * Usage:
 *   pnpm app:resolve
 */
import { ascFetch, formatApiError, getConfig } from './client.mjs'
import { BUNDLE_ID } from './metadata-catalog.mjs'

/**
 * @returns {Promise<{ id: string, bundleId: string, name: string }>}
 */
export async function resolveApp() {
  const cfg = getConfig()
  const bundleId = cfg.bundleId || BUNDLE_ID

  if (cfg.appAppleId) {
    const json = await ascFetch(`/v1/apps/${cfg.appAppleId}`, {
      query: { 'fields[apps]': 'name,bundleId' }
    })
    const app = json.data
    if (!app) throw new Error(`App not found for ASC_APP_APPLE_ID=${cfg.appAppleId}`)
    return {
      id: app.id,
      bundleId: app.attributes?.bundleId || '',
      name: app.attributes?.name || ''
    }
  }

  if (!bundleId) {
    throw new Error('ASC_BUNDLE_ID (or BUNDLE_ID in catalog) gerekli.')
  }

  const json = await ascFetch('/v1/apps', {
    query: {
      'filter[bundleId]': bundleId,
      limit: '10',
      'fields[apps]': 'name,bundleId'
    }
  })

  const apps = json.data || []
  if (!apps.length) {
    throw new Error(`No ASC app for bundleId=${bundleId}`)
  }
  if (apps.length > 1) {
    console.warn(`Ambiguous: ${apps.length} apps for ${bundleId}; using first.`)
  }

  const app = apps[0]
  return {
    id: app.id,
    bundleId: app.attributes?.bundleId || bundleId,
    name: app.attributes?.name || ''
  }
}

async function main() {
  const app = await resolveApp()
  console.log(`Apple ID: ${app.id}`)
  console.log(`Bundle:   ${app.bundleId}`)
  console.log(`Name:     ${app.name}`)
  console.log(
    'Bu ID, App Store Connect → App Information → Apple ID ile eşleşmeli.'
  )
}

const isDirect =
  process.argv[1] &&
  (process.argv[1].endsWith('resolve-app.mjs') ||
    process.argv[1].includes('resolve-app'))

if (isDirect) {
  main().catch((err) => {
    console.error(formatApiError(err))
    process.exit(1)
  })
}
