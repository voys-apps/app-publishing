/**
 * Upsert Play Store listing (EN + TR) + app contact details, then commit edit.
 *
 * Usage:
 *   pnpm listing:upsert
 *   pnpm listing:upsert -- --dry-run
 *
 * Note: Screenshots / feature graphic are NOT uploaded here — add assets under
 * assets/play-store/ then use listing:upload-images (future) or Console.
 */
import {
  APP_DETAILS,
  assertListingLimits,
  PACKAGE_NAME,
  STORE_LISTINGS
} from './listing-catalog.mjs'
import { formatApiError, getAndroidPublisher } from './client.mjs'

const DRY_RUN = process.argv.includes('--dry-run')
const NO_COMMIT = process.argv.includes('--no-commit')

async function main() {
  for (const [lang, listing] of Object.entries(STORE_LISTINGS)) {
    assertListingLimits(lang, listing)
    console.log(
      `${lang}: title=${[...listing.title].length}/30 short=${[...listing.shortDescription].length}/80 full=${[...listing.fullDescription].length}/4000`
    )
  }

  if (DRY_RUN) {
    console.log('[dry-run] would update listings + details and commit')
    console.log(JSON.stringify({ STORE_LISTINGS, APP_DETAILS }, null, 2))
    return
  }

  const { androidpublisher, keyFile } = await getAndroidPublisher()
  console.log(`Package: ${PACKAGE_NAME}`)
  console.log(`Key: ${keyFile}`)

  const editRes = await androidpublisher.edits.insert({
    packageName: PACKAGE_NAME,
    requestBody: {}
  })
  const editId = editRes.data.id
  console.log(`Edit: ${editId}`)

  try {
    for (const [language, listing] of Object.entries(STORE_LISTINGS)) {
      const requestBody = {
        language,
        title: listing.title,
        shortDescription: listing.shortDescription,
        fullDescription: listing.fullDescription
      }
      if (listing.video) requestBody.video = listing.video

      await androidpublisher.edits.listings.update({
        packageName: PACKAGE_NAME,
        editId,
        language,
        requestBody
      })
      console.log(`✓ listing ${language}`)
    }

    const detailsBody = {
      defaultLanguage: APP_DETAILS.defaultLanguage,
      contactEmail: APP_DETAILS.contactEmail,
      contactWebsite: APP_DETAILS.contactWebsite
    }
    if (APP_DETAILS.contactPhone) detailsBody.contactPhone = APP_DETAILS.contactPhone

    await androidpublisher.edits.details.patch({
      packageName: PACKAGE_NAME,
      editId,
      requestBody: detailsBody
    })
    console.log('✓ app details (contact + defaultLanguage)')

    if (NO_COMMIT) {
      console.log('--no-commit: edit left open', editId)
      return
    }

    const committed = await androidpublisher.edits.commit({
      packageName: PACKAGE_NAME,
      editId
    })
    console.log(`\nCommitted edit ${committed.data.id}`)
    console.log('Store listing EN + TR updated.')
  } catch (err) {
    try {
      await androidpublisher.edits.delete({ packageName: PACKAGE_NAME, editId })
    } catch {
      /* ignore */
    }
    throw err
  }
}

main().catch(err => {
  console.error(formatApiError(err))
  process.exit(1)
})
