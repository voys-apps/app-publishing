/**
 * Upsert TestFlight "What to Test" (betaBuildLocalizations.whatsNew) for a build.
 *
 * Usage:
 *   pnpm testflight:upsert-notes -- --version=1.1.0 --build=6
 *   pnpm testflight:upsert-notes -- --build-id=<uuid> --dry-run
 */
import {
  assertMetadataLimits,
  TESTFLIGHT_BUILD_LOCALIZATIONS
} from './metadata-catalog.mjs'
import { ascFetch, formatApiError, getConfig } from './client.mjs'
import { resolveApp } from './resolve-app.mjs'

const DRY_RUN = process.argv.includes('--dry-run')

function argValue(prefix) {
  const hit = process.argv.find(a => a.startsWith(prefix))
  return hit ? hit.slice(prefix.length) : undefined
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * @param {string} appId
 * @param {string | undefined} versionString
 * @param {string | undefined} buildNumber
 */
async function findBuild(appId, versionString, buildNumber) {
  const json = await ascFetch('/v1/builds', {
    query: {
      limit: '30',
      'filter[app]': appId,
      'fields[builds]': 'version,uploadedDate,processingState,preReleaseVersion'
    }
  })
  const builds = (json.data || []).slice().sort((a, b) => {
    const aDate = Date.parse(a.attributes?.uploadedDate || '') || 0
    const bDate = Date.parse(b.attributes?.uploadedDate || '') || 0
    return bDate - aDate
  })

  if (!builds.length) {
    throw new Error('No builds found for app (upload still processing?)')
  }

  if (buildNumber) {
    const match = builds.find(b => String(b.attributes?.version) === String(buildNumber))
    if (!match) {
      const available = builds
        .slice(0, 8)
        .map(b => b.attributes?.version)
        .filter(Boolean)
        .join(', ')
      throw new Error(
        `Build number ${buildNumber} not found yet. Recent build numbers: ${available || '(none)'}`
      )
    }
    return match
  }

  if (versionString) {
    console.warn(
      `Version filter ${versionString} not applied — pass --build=<CFBundleVersion> after upload.`
    )
  }

  return builds[0]
}

/**
 * @param {string} buildId
 */
async function listBetaLocalizations(buildId) {
  const json = await ascFetch(`/v1/builds/${buildId}/betaBuildLocalizations`, {
    query: {
      limit: '50',
      'fields[betaBuildLocalizations]': 'locale,whatsNew'
    }
  })
  return json.data || []
}

/**
 * @param {string} buildId
 * @param {string} locale
 * @param {string} whatsNew
 */
async function createBetaLocalization(buildId, locale, whatsNew) {
  return ascFetch('/v1/betaBuildLocalizations', {
    method: 'POST',
    body: {
      data: {
        type: 'betaBuildLocalizations',
        attributes: { locale, whatsNew },
        relationships: {
          build: { data: { type: 'builds', id: buildId } }
        }
      }
    }
  })
}

/**
 * @param {string} id
 * @param {string} whatsNew
 */
async function patchBetaLocalization(id, whatsNew) {
  return ascFetch(`/v1/betaBuildLocalizations/${id}`, {
    method: 'PATCH',
    body: {
      data: {
        type: 'betaBuildLocalizations',
        id,
        attributes: { whatsNew }
      }
    }
  })
}

async function main() {
  getConfig()
  const versionString = argValue('--version=') || process.env.ASC_VERSION
  const buildNumber = argValue('--build=') || process.env.ASC_BUILD_NUMBER
  const buildIdArg = argValue('--build-id=')
  const waitMinutes = Number(argValue('--wait-min=') || '15')

  for (const [locale, row] of Object.entries(TESTFLIGHT_BUILD_LOCALIZATIONS)) {
    assertMetadataLimits(locale, row)
  }

  const app = await resolveApp()
  console.log(`App: ${app.name} (${app.bundleId}) id=${app.id}`)

  let build = null
  if (buildIdArg) {
    const json = await ascFetch(`/v1/builds/${buildIdArg}`, {
      query: { 'fields[builds]': 'version,processingState,uploadedDate' }
    })
    build = json.data
  } else {
    const deadline = Date.now() + waitMinutes * 60 * 1000
    while (Date.now() < deadline) {
      try {
        build = await findBuild(app.id, versionString, buildNumber)
        break
      } catch (err) {
        if (!String(err.message).includes('not found yet') && !String(err.message).includes('No builds found')) {
          throw err
        }
        console.log(`Waiting for build ${versionString || ''} ${buildNumber || ''}…`)
        await sleep(30_000)
      }
    }
    if (!build) {
      throw new Error(`Timed out after ${waitMinutes}m waiting for build to appear`)
    }
  }

  const attrs = build.attributes || {}
  console.log(
    `Build: ${build.id} version=${attrs.version} state=${attrs.processingState || '?'} uploaded=${attrs.uploadedDate || '?'}`
  )

  const existing = await listBetaLocalizations(build.id)
  const byLocale = new Map(existing.map(item => [item.attributes?.locale, item]))

  for (const [locale, row] of Object.entries(TESTFLIGHT_BUILD_LOCALIZATIONS)) {
    const whatsNew = row.whatsNew
    if (!whatsNew) {
      console.log(`${locale}: empty whatsNew — skip`)
      continue
    }

    const current = byLocale.get(locale)
    if (DRY_RUN) {
      console.log(`[dry-run] ${current ? 'PATCH' : 'POST'} ${locale}`, whatsNew.slice(0, 80))
      continue
    }

    if (current) {
      await patchBetaLocalization(current.id, whatsNew)
      console.log(`Updated TestFlight notes ${locale} (${current.id})`)
    } else {
      const created = await createBetaLocalization(build.id, locale, whatsNew)
      console.log(`Created TestFlight notes ${locale} (${created.data?.id})`)
    }
  }

  console.log(DRY_RUN ? 'Dry-run complete.' : 'Done.')
}

main().catch(err => {
  console.error(formatApiError(err))
  process.exit(1)
})
