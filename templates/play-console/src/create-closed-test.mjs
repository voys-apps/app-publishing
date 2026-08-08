/**
 * Create a closed-testing release from the latest existing Play bundle and
 * grant access to a Google Group.
 *
 * Usage:
 *   pnpm testing:create-closed
 *   pnpm testing:create-closed -- --dry-run
 */
import { PACKAGE_NAME } from './listing-catalog.mjs'
import { formatApiError, getAndroidPublisher } from './client.mjs'

function argValue(prefix, fallback) {
  const hit = process.argv.find(a => a.startsWith(prefix))
  return hit ? hit.slice(prefix.length) : fallback
}

const TRACK = argValue('--track=', process.env.PLAY_CLOSED_TRACK || 'closed')
const TESTER_GROUP = argValue(
  '--group=',
  process.env.PLAY_CLOSED_GROUP || 'testers@googlegroups.com'
)
const DRY_RUN = process.argv.includes('--dry-run')

function latestVersionCode(bundles) {
  const codes = bundles
    .map(bundle => Number(bundle.versionCode))
    .filter(Number.isFinite)
  if (!codes.length) throw new Error('Play Console’da kullanılabilir AAB bulunamadı.')
  return Math.max(...codes)
}

async function main() {
  const { androidpublisher, keyFile } = await getAndroidPublisher()
  console.log(`Package: ${PACKAGE_NAME}`)
  console.log(`Track: ${TRACK} (Closed testing)`)
  console.log(`Google Group: ${TESTER_GROUP}`)
  console.log(`Key: ${keyFile}`)

  const edit = await androidpublisher.edits.insert({
    packageName: PACKAGE_NAME,
    requestBody: {}
  })
  const editId = edit.data.id

  try {
    const tracks = await androidpublisher.edits.tracks.list({
      packageName: PACKAGE_NAME,
      editId
    })
    const trackExists = (tracks.data.tracks || []).some(track => track.track === TRACK)

    if (!trackExists) {
      await androidpublisher.edits.tracks.create({
        packageName: PACKAGE_NAME,
        editId,
        requestBody: {
          track: TRACK,
          type: 'CLOSED_TESTING',
          formFactor: 'DEFAULT'
        }
      })
      console.log(`✓ Closed track created: ${TRACK}`)
    }

    const bundles = await androidpublisher.edits.bundles.list({
      packageName: PACKAGE_NAME,
      editId
    })
    const versionCode = latestVersionCode(bundles.data.bundles || [])
    console.log(`Latest existing bundle: versionCode ${versionCode}`)

    if (DRY_RUN) {
      console.log('[dry-run] would set beta testers and publish the bundle')
      await androidpublisher.edits.delete({ packageName: PACKAGE_NAME, editId })
      return
    }

    await androidpublisher.edits.testers.update({
      packageName: PACKAGE_NAME,
      editId,
      track: TRACK,
      requestBody: { googleGroups: [TESTER_GROUP] }
    })
    console.log(`✓ Testers updated: ${TESTER_GROUP}`)

    await androidpublisher.edits.tracks.update({
      packageName: PACKAGE_NAME,
      editId,
      track: TRACK,
      requestBody: {
        track: TRACK,
        releases: [
          {
            name: `Closed test ${versionCode}`,
            versionCodes: [String(versionCode)],
            // A Play app that has not left its initial draft state cannot
            // serve a completed test release. This creates the required draft
            // and lets Play Console surface its remaining setup requirements.
            status: 'draft',
            releaseNotes: [
              {
                language: 'en-US',
                text: 'Closed testing release.'
              },
              {
                language: 'tr-TR',
                text: 'Kapalı test sürümü.'
              }
            ]
          }
        ]
      }
    })
    console.log(`✓ Closed test release prepared: v${versionCode}`)

    const committed = await androidpublisher.edits.commit({
      packageName: PACKAGE_NAME,
      editId
    })
    console.log(`✓ Committed edit ${committed.data.id}`)
  } catch (err) {
    await androidpublisher.edits.delete({ packageName: PACKAGE_NAME, editId }).catch(() => {})
    throw err
  }
}

main().catch(err => {
  console.error(formatApiError(err))
  process.exit(1)
})
