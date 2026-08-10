/**
 * Upsert App Store version localizations (+ optional review detail).
 *
 * Usage:
 *   pnpm metadata:upsert
 *   pnpm metadata:upsert -- --dry-run
 *   pnpm metadata:upsert -- --version=1.3.1
 *   pnpm metadata:upsert -- --review-only
 */
import {
  assertMetadataLimits,
  REVIEW,
  VERSION_LOCALIZATIONS
} from './metadata-catalog.mjs'
import { ascFetch, formatApiError, getConfig } from './client.mjs'
import { resolveApp } from './resolve-app.mjs'

const DRY_RUN = process.argv.includes('--dry-run')
const REVIEW_ONLY = process.argv.includes('--review-only')

function argValue(prefix) {
  const hit = process.argv.find((a) => a.startsWith(prefix))
  return hit ? hit.slice(prefix.length) : undefined
}

const EDITABLE_HINT = new Set([
  'PREPARE_FOR_SUBMISSION',
  'DEVELOPER_REJECTED',
  'REJECTED',
  'METADATA_REJECTED',
  'WAITING_FOR_REVIEW',
  'IN_REVIEW',
  'PENDING_DEVELOPER_RELEASE',
  'READY_FOR_REVIEW'
])

/**
 * @param {string} appId
 * @param {string | undefined} versionString
 */
async function resolveIosVersion(appId, versionString) {
  const query = {
    'filter[platform]': 'IOS',
    limit: '50',
    'fields[appStoreVersions]': 'versionString,appStoreState,platform'
  }
  if (versionString) query['filter[versionString]'] = versionString

  const json = await ascFetch(`/v1/apps/${appId}/appStoreVersions`, { query })
  const versions = json.data || []
  if (!versions.length) {
    throw new Error(
      versionString
        ? `No iOS appStoreVersion for versionString=${versionString}`
        : 'No iOS appStoreVersions found — create a version in ASC first.'
    )
  }

  if (versionString) {
    return versions[0]
  }

  const editable = versions.find((v) =>
    EDITABLE_HINT.has(v.attributes?.appStoreState)
  )
  return editable || versions[0]
}

/**
 * @param {string} versionId
 */
async function listLocalizations(versionId) {
  const json = await ascFetch(
    `/v1/appStoreVersions/${versionId}/appStoreVersionLocalizations`,
    {
      query: {
        limit: '200',
        'fields[appStoreVersionLocalizations]':
          'locale,whatsNew,promotionalText,description,keywords,supportUrl,marketingUrl'
      }
    }
  )
  return json.data || []
}

/**
 * @param {string} versionId
 * @param {string} locale
 * @param {Record<string, string>} attributes
 */
async function createLocalization(versionId, locale, attributes) {
  return ascFetch('/v1/appStoreVersionLocalizations', {
    method: 'POST',
    body: {
      data: {
        type: 'appStoreVersionLocalizations',
        attributes: { locale, ...attributes },
        relationships: {
          appStoreVersion: {
            data: { type: 'appStoreVersions', id: versionId }
          }
        }
      }
    }
  })
}

/**
 * @param {string} localizationId
 * @param {Record<string, string>} attributes
 */
async function patchLocalization(localizationId, attributes) {
  return ascFetch(`/v1/appStoreVersionLocalizations/${localizationId}`, {
    method: 'PATCH',
    body: {
      data: {
        type: 'appStoreVersionLocalizations',
        id: localizationId,
        attributes
      }
    }
  })
}

/**
 * @param {Record<string, unknown>} row
 */
function localizationAttributesFromRow(row) {
  const attrs = {}
  for (const key of [
    'whatsNew',
    'promotionalText',
    'description',
    'keywords',
    'supportUrl',
    'marketingUrl'
  ]) {
    if (row[key] != null && row[key] !== '') attrs[key] = String(row[key])
  }
  return attrs
}

/**
 * @param {string} versionId
 */
async function upsertReview(versionId) {
  if (!REVIEW) {
    console.log('REVIEW catalog empty — skip review detail')
    return
  }

  const attrs = {}
  if (REVIEW.notes != null) attrs.notes = REVIEW.notes
  if (REVIEW.demoAccountName != null) attrs.demoAccountName = REVIEW.demoAccountName
  if (REVIEW.demoAccountPassword != null) {
    attrs.demoAccountPassword = REVIEW.demoAccountPassword
  }
  if (REVIEW.demoAccountRequired != null) {
    attrs.demoAccountRequired = REVIEW.demoAccountRequired
  }

  if (!Object.keys(attrs).length) {
    console.log('REVIEW has no fields — skip')
    return
  }

  if (DRY_RUN) {
    console.log('[dry-run] would PATCH appStoreReviewDetail', {
      ...attrs,
      demoAccountPassword: attrs.demoAccountPassword ? '***' : undefined
    })
    return
  }

  const existing = await ascFetch(
    `/v1/appStoreVersions/${versionId}/appStoreReviewDetail`,
    {
      query: {
        'fields[appStoreReviewDetails]':
          'notes,demoAccountName,demoAccountRequired'
      }
    }
  )

  const detail = existing.data
  if (!detail?.id) {
    console.warn(
      'No appStoreReviewDetail on this version — create review info in ASC UI once, then re-run.'
    )
    return
  }

  await ascFetch(`/v1/appStoreReviewDetails/${detail.id}`, {
    method: 'PATCH',
    body: {
      data: {
        type: 'appStoreReviewDetails',
        id: detail.id,
        attributes: attrs
      }
    }
  })
  console.log(`Review detail updated: ${detail.id}`)
}

async function main() {
  const cfg = getConfig()
  const versionArg = argValue('--version=') || cfg.version
  const app = await resolveApp()

  console.log(`App: ${app.name} (${app.bundleId}) id=${app.id}`)

  const version = await resolveIosVersion(app.id, versionArg)
  const vAttrs = version.attributes || {}
  console.log(
    `Version: ${vAttrs.versionString} state=${vAttrs.appStoreState} id=${version.id}`
  )

  if (!REVIEW_ONLY) {
    const locales = Object.keys(VERSION_LOCALIZATIONS)
    if (!locales.length) {
      throw new Error('VERSION_LOCALIZATIONS empty in metadata-catalog.mjs')
    }

    for (const [locale, row] of Object.entries(VERSION_LOCALIZATIONS)) {
      assertMetadataLimits(locale, row)
    }

    const existing = await listLocalizations(version.id)
    const byLocale = new Map(
      existing.map((loc) => [loc.attributes?.locale, loc])
    )

    for (const [locale, row] of Object.entries(VERSION_LOCALIZATIONS)) {
      const attrs = localizationAttributesFromRow(row)
      if (!Object.keys(attrs).length) {
        console.log(`${locale}: no attributes — skip`)
        continue
      }

      const current = byLocale.get(locale)
      if (DRY_RUN) {
        console.log(
          `[dry-run] ${current ? 'PATCH' : 'POST'} ${locale}`,
          Object.fromEntries(
            Object.entries(attrs).map(([k, v]) => [
              k,
              typeof v === 'string' && v.length > 80 ? `${v.slice(0, 80)}…` : v
            ])
          )
        )
        continue
      }

      if (current) {
        await patchLocalization(current.id, attrs)
        console.log(`Updated localization ${locale} (${current.id})`)
      } else {
        const created = await createLocalization(version.id, locale, attrs)
        console.log(`Created localization ${locale} (${created.data?.id})`)
      }
    }
  }

  await upsertReview(version.id)
  console.log(DRY_RUN ? 'Dry-run complete.' : 'Done.')
}

main().catch((err) => {
  console.error(formatApiError(err))
  process.exit(1)
})
