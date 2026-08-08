import { PACKAGE_NAME } from './catalog.mjs'
import { formatApiError, getAndroidPublisher, resolveCredentialsPath } from './client.mjs'

async function main() {
  const keyFile = resolveCredentialsPath()
  console.log('Key:', keyFile)
  console.log('Package:', PACKAGE_NAME)

  const { androidpublisher } = await getAndroidPublisher()

  // Legacy inappproducts is blocked for apps on the new catalog model.
  // Use monetization.* + edits as the health check.
  const [otp, subs, edit] = await Promise.all([
    androidpublisher.monetization.onetimeproducts.list({ packageName: PACKAGE_NAME }),
    androidpublisher.monetization.subscriptions.list({ packageName: PACKAGE_NAME }),
    androidpublisher.edits.insert({ packageName: PACKAGE_NAME, requestBody: {} })
  ])

  const oneTime = otp.data.oneTimeProducts || []
  const subscriptions = subs.data.subscriptions || []

  console.log(`OK — Android Publisher API`)
  console.log(`- one-time products: ${oneTime.length}`)
  for (const p of oneTime) {
    console.log(`  · ${p.productId || p.packageName || JSON.stringify(p).slice(0, 80)}`)
  }
  console.log(`- subscriptions: ${subscriptions.length}`)
  for (const s of subscriptions) {
    console.log(`  · ${s.productId}`)
  }
  console.log(`- edits.insert: ${edit.data.id}`)

  // Discard unused edit
  try {
    await androidpublisher.edits.delete({
      packageName: PACKAGE_NAME,
      editId: edit.data.id
    })
  } catch {
    /* ignore */
  }
}

main().catch(err => {
  console.error('Auth/API check failed:\n', formatApiError(err))
  process.exit(1)
})
