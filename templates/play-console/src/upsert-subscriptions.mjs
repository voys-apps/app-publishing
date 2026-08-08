/**
 * Upsert Pro subscriptions via monetization API.
 *
 * Usage:
 *   pnpm subscriptions:upsert
 *   pnpm subscriptions:upsert -- --dry-run
 */
import { PACKAGE_NAME, SUBSCRIPTIONS } from './catalog.mjs'
import { formatApiError, getAndroidPublisher } from './client.mjs'

const DRY_RUN = process.argv.includes('--dry-run')

function money(usd, currencyCode = 'USD') {
  const n = Number(usd)
  const units = Math.floor(n)
  const nanos = Math.round((n - units) * 1_000_000_000)
  return { currencyCode, units: String(units), nanos }
}

function tryPrice(sub) {
  // US required; TR approximate for Console parity (~₺199 / ~₺1999)
  const tr =
    sub.priceUsd === '4.99'
      ? { currencyCode: 'TRY', units: '199', nanos: 990_000_000 }
      : { currencyCode: 'TRY', units: '1999', nanos: 990_000_000 }

  return [
    {
      regionCode: 'US',
      newSubscriberAvailability: true,
      price: money(sub.priceUsd, 'USD')
    },
    {
      regionCode: 'TR',
      newSubscriberAvailability: true,
      price: tr
    }
  ]
}

async function upsertSubscription(androidpublisher, sub) {
  const requestBody = {
    packageName: PACKAGE_NAME,
    productId: sub.productId,
    listings: {
      'en-US': { title: sub.titleEn, description: sub.descEn },
      'tr-TR': { title: sub.titleTr, description: sub.descTr }
    },
    basePlans: [
      {
        basePlanId: sub.basePlanId,
        autoRenewingBasePlanType: {
          billingPeriodDuration: sub.billingPeriodDuration,
          gracePeriodDuration: 'P3D',
          resubscribeState: 'RESUBSCRIBE_STATE_ACTIVE'
        },
        regionalConfigs: tryPrice(sub)
      }
    ]
  }

  if (DRY_RUN) {
    console.log('[dry-run]', sub.productId, sub.basePlanId, `$${sub.priceUsd}`)
    return { productId: sub.productId, action: 'dry-run' }
  }

  let existed = true
  try {
    await androidpublisher.monetization.subscriptions.get({
      packageName: PACKAGE_NAME,
      productId: sub.productId
    })
  } catch (err) {
    if ((err?.response?.status || err?.code) !== 404) throw err
    existed = false
  }

  if (!existed) {
    await androidpublisher.monetization.subscriptions.create({
      packageName: PACKAGE_NAME,
      productId: sub.productId,
      'regionsVersion.version': '2022/02',
      requestBody
    })
  } else {
    await androidpublisher.monetization.subscriptions.patch({
      packageName: PACKAGE_NAME,
      productId: sub.productId,
      updateMask: 'listings,basePlans',
      'regionsVersion.version': '2022/02',
      requestBody
    })
  }

  try {
    await androidpublisher.monetization.subscriptions.basePlans.activate({
      packageName: PACKAGE_NAME,
      productId: sub.productId,
      basePlanId: sub.basePlanId
    })
  } catch (err) {
    console.warn(
      `  activate warning (${sub.basePlanId}):`,
      formatApiError(err).slice(0, 240)
    )
  }

  return { productId: sub.productId, action: existed ? 'updated' : 'created' }
}

async function main() {
  const { androidpublisher, keyFile } = await getAndroidPublisher()
  console.log(`Package: ${PACKAGE_NAME}`)
  console.log(`Key: ${keyFile}`)
  console.log(`Subscriptions: ${SUBSCRIPTIONS.length}${DRY_RUN ? ' (dry-run)' : ''}`)

  const results = []
  for (const sub of SUBSCRIPTIONS) {
    process.stdout.write(`→ ${sub.productId} ... `)
    try {
      const r = await upsertSubscription(androidpublisher, sub)
      console.log(r.action)
      results.push(r)
    } catch (err) {
      console.log('FAILED')
      console.error(formatApiError(err))
      results.push({ productId: sub.productId, action: 'error' })
      process.exitCode = 1
    }
  }

  console.log('\nDone.')
  console.log(JSON.stringify(results, null, 2))
}

main().catch(err => {
  console.error(formatApiError(err))
  process.exit(1)
})
