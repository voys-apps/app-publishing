/**
 * Verify ASC API key can list apps.
 *
 * Usage:
 *   pnpm auth:check
 */
import { ascFetch, formatApiError, getConfig } from './client.mjs'

async function main() {
  const cfg = getConfig()
  console.log(`Issuer: ${cfg.issuerId}`)
  console.log(`Key ID: ${cfg.keyId}`)
  console.log(`Key file: ${cfg.privateKeyPath}`)
  if (cfg.teamId) console.log(`Team ID: ${cfg.teamId}`)

  const json = await ascFetch('/v1/apps', {
    query: {
      limit: '50',
      'fields[apps]': 'name,bundleId,sku'
    }
  })

  const apps = json.data || []
  console.log(`Apps visible: ${apps.length}`)
  for (const app of apps) {
    const a = app.attributes || {}
    console.log(`- ${app.id}  ${a.bundleId || '?'}  ${a.name || '?'}`)
  }

  if (!apps.length) {
    console.warn(
      'Uyarı: Hiç app dönmedi. Key rolünü (Admin/App Manager) ve provider’ı kontrol et.'
    )
  }
}

main().catch((err) => {
  console.error(formatApiError(err))
  process.exit(1)
})
