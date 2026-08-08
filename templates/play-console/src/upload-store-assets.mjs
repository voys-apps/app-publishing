/**
 * Upload Play Store icon, feature graphic, and phone screenshots, then commit.
 *
 * Usage:
 *   pnpm listing:upload-assets
 *   pnpm listing:upload-assets -- --dry-run
 *
 * Edit paths in assets-catalog.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { STORE_ASSETS } from './assets-catalog.mjs'
import { PACKAGE_NAME } from './listing-catalog.mjs'
import { formatApiError, getAndroidPublisher } from './client.mjs'

const DRY_RUN = process.argv.includes('--dry-run')
const LANGUAGE = 'en-US'

function assertAssetsExist() {
  for (const asset of STORE_ASSETS) {
    if (!fs.existsSync(asset.file)) {
      throw new Error(`Asset not found: ${asset.file}`)
    }
  }
}

async function main() {
  assertAssetsExist()

  if (DRY_RUN) {
    console.log('[dry-run] would upload:')
    for (const asset of STORE_ASSETS) {
      console.log(`- ${asset.imageType}: ${asset.file}`)
    }
    return
  }

  const { androidpublisher, keyFile } = await getAndroidPublisher()
  console.log(`Package: ${PACKAGE_NAME}`)
  console.log(`Key: ${keyFile}`)

  const edit = await androidpublisher.edits.insert({
    packageName: PACKAGE_NAME,
    requestBody: {}
  })
  const editId = edit.data.id
  console.log(`Edit: ${editId}`)

  try {
    for (const imageType of ['icon', 'featureGraphic', 'phoneScreenshots']) {
      await androidpublisher.edits.images.deleteall({
        packageName: PACKAGE_NAME,
        editId,
        language: LANGUAGE,
        imageType
      })
      console.log(`✓ cleared ${imageType}`)
    }

    for (const asset of STORE_ASSETS) {
      const response = await androidpublisher.edits.images.upload({
        packageName: PACKAGE_NAME,
        editId,
        language: LANGUAGE,
        imageType: asset.imageType,
        media: {
          mimeType: 'image/png',
          body: fs.createReadStream(asset.file)
        }
      })
      console.log(
        `✓ uploaded ${asset.imageType}: ${path.basename(asset.file)} (${response.data.image?.id || 'ok'})`
      )
    }

    const committed = await androidpublisher.edits.commit({
      packageName: PACKAGE_NAME,
      editId
    })
    console.log(`Committed edit ${committed.data.id}`)
  } catch (err) {
    await androidpublisher.edits.delete({ packageName: PACKAGE_NAME, editId }).catch(() => {})
    throw err
  }
}

main().catch(err => {
  console.error(formatApiError(err))
  process.exit(1)
})
