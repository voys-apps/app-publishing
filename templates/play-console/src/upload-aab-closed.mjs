/**
 * Upload a local AAB to Play and optionally assign to a closed-testing track.
 *
 * Usage:
 *   pnpm testing:upload-aab -- --aab=/path/to/app.aab
 *   pnpm testing:upload-aab -- --aab=./app.aab --track=receezy-closed --group=receezy@googlegroups.com
 *   pnpm testing:upload-aab -- --aab=./app.aab --track=receezy-closed --status=completed
 *   pnpm testing:upload-aab -- --aab=./app.aab --dry-run
 *
 * Local CI flow (app repo root):
 *   pnpm build:android
 *   pnpm --dir scripts/play-console testing:upload-aab -- --aab="$(ls -t *.aab | head -1)" --track=receezy-closed --status=completed
 */
import fs from 'node:fs'
import path from 'node:path'
import { PACKAGE_NAME } from './listing-catalog.mjs'
import { formatApiError, getAndroidPublisher } from './client.mjs'

function argValue(prefix, fallback) {
  const hit = process.argv.find(a => a.startsWith(prefix))
  return hit ? hit.slice(prefix.length) : fallback
}

const AAB = argValue('--aab=', process.env.PLAY_AAB_PATH || '')
const TRACK = argValue('--track=', process.env.PLAY_CLOSED_TRACK || 'receezy-closed')
const TESTER_GROUP = argValue(
  '--group=',
  process.env.PLAY_CLOSED_GROUP || 'receezy@googlegroups.com'
)
const STATUS = argValue('--status=', process.env.PLAY_RELEASE_STATUS || 'completed')
const DRY_RUN = process.argv.includes('--dry-run')
const SKIP_TESTERS = process.argv.includes('--skip-testers')

async function main() {
  if (!AAB) {
    throw new Error('Missing --aab=/path/to/app.aab (or PLAY_AAB_PATH)')
  }
  const aabPath = path.resolve(AAB)
  if (!fs.existsSync(aabPath)) {
    throw new Error(`AAB not found: ${aabPath}`)
  }
  if (!aabPath.endsWith('.aab')) {
    throw new Error(`Expected .aab file, got: ${aabPath}`)
  }

  const { androidpublisher, keyFile } = await getAndroidPublisher()
  console.log(`Package: ${PACKAGE_NAME}`)
  console.log(`AAB: ${aabPath}`)
  console.log(`Track: ${TRACK}`)
  console.log(`Status: ${STATUS}`)
  console.log(`Group: ${TESTER_GROUP}`)
  console.log(`Key: ${keyFile}`)

  if (DRY_RUN) {
    console.log('[dry-run] would upload AAB + update track/testers')
    return
  }

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
    const trackExists = (tracks.data.tracks || []).some(t => t.track === TRACK)
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

    console.log('Uploading AAB…')
    const uploaded = await androidpublisher.edits.bundles.upload({
      packageName: PACKAGE_NAME,
      editId,
      media: {
        mimeType: 'application/octet-stream',
        body: fs.createReadStream(aabPath)
      }
    })
    const versionCode = uploaded.data.versionCode
    console.log(`✓ Uploaded versionCode ${versionCode}`)

    if (!SKIP_TESTERS) {
      await androidpublisher.edits.testers.update({
        packageName: PACKAGE_NAME,
        editId,
        track: TRACK,
        requestBody: { googleGroups: [TESTER_GROUP] }
      })
      console.log(`✓ Testers: ${TESTER_GROUP}`)
    }

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
            status: STATUS,
            releaseNotes: [
              { language: 'en-US', text: 'Closed testing release.' },
              { language: 'tr-TR', text: 'Kapalı test sürümü.' }
            ]
          }
        ]
      }
    })
    console.log(`✓ Track ${TRACK} → ${STATUS} v${versionCode}`)

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
