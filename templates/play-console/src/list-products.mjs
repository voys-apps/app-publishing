import { PACKAGE_NAME } from './catalog.mjs'
import { formatApiError, getAndroidPublisher } from './client.mjs'

async function main() {
  const { androidpublisher } = await getAndroidPublisher()
  const res = await androidpublisher.inappproducts.list({
    packageName: PACKAGE_NAME
  })
  const items = res.data.inappproduct || []
  console.log(JSON.stringify(items, null, 2))
}

main().catch(err => {
  console.error(formatApiError(err))
  process.exit(1)
})
