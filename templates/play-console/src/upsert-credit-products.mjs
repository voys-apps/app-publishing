/**
 * Upsert credit one-time products via monetization.onetimeproducts (new catalog).
 *
 * Usage:
 *   npm run products:upsert-credits
 *   npm run products:upsert-credits -- --dry-run
 *   npm run products:upsert-credits -- --only=25k,50k
 */
import { CREDIT_PRODUCTS, PACKAGE_NAME } from './catalog.mjs'
import { formatApiError, getAndroidPublisher } from './client.mjs'

const DRY_RUN = process.argv.includes('--dry-run')
const onlyArg = process.argv.find(a => a.startsWith('--only='))
const ONLY = onlyArg
  ? onlyArg
      .slice('--only='.length)
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)
  : null

const REGIONS_VERSION = '2025/03'

function moneyFromUsd(usd) {
  const n = Number(usd)
  const units = Math.floor(n)
  const nanos = Math.round((n - units) * 1_000_000_000)
  return { currencyCode: 'USD', units: String(units), nanos }
}

/** Rough EUR for newRegionsConfig (Play requires usdPrice + eurPrice). */
function eurFromUsd(usd) {
  const map = {
    '4.99': { currencyCode: 'EUR', units: '4', nanos: 990_000_000 },
    '9.99': { currencyCode: 'EUR', units: '9', nanos: 990_000_000 },
    '17.99': { currencyCode: 'EUR', units: '16', nanos: 990_000_000 },
    '34.99': { currencyCode: 'EUR', units: '32', nanos: 990_000_000 },
    '59.99': { currencyCode: 'EUR', units: '54', nanos: 990_000_000 }
  }
  return map[usd] || { currencyCode: 'EUR', units: '4', nanos: 990_000_000 }
}

function tryFromUsd(usd) {
  // Approximate TRY for Console parity (~₺199 for $4.99 pack)
  const map = {
    '4.99': { currencyCode: 'TRY', units: '199', nanos: 990_000_000 },
    '9.99': { currencyCode: 'TRY', units: '399', nanos: 990_000_000 },
    '17.99': { currencyCode: 'TRY', units: '699', nanos: 990_000_000 },
    '34.99': { currencyCode: 'TRY', units: '1299', nanos: 990_000_000 },
    '59.99': { currencyCode: 'TRY', units: '2299', nanos: 990_000_000 }
  }
  return map[usd] || { currencyCode: 'TRY', units: '199', nanos: 990_000_000 }
}

function toOneTimeProduct(p) {
  const usd = moneyFromUsd(p.priceUsd)
  return {
    packageName: PACKAGE_NAME,
    productId: p.sku,
    listings: [
      {
        languageCode: 'en-US',
        title: p.titleEn,
        description: p.descEn
      },
      {
        languageCode: 'tr-TR',
        title: p.titleTr,
        description: p.descTr
      }
    ],
    taxAndComplianceSettings: {
      regionalProductAgeRatingInfos: [
        {
          regionCode: 'US',
          productAgeRatingTier: 'PRODUCT_AGE_RATING_TIER_EVERYONE'
        }
      ]
    },
    purchaseOptions: [
      {
        purchaseOptionId: 'credit',
        // Omit state on create; activate after if needed
        buyOption: {
          legacyCompatible: true
        },
        regionalPricingAndAvailabilityConfigs: [
          {
            regionCode: 'US',
            price: usd,
            availability: 'AVAILABLE'
          },
          {
            regionCode: 'TR',
            price: tryFromUsd(p.priceUsd),
            availability: 'AVAILABLE'
          }
        ],
        newRegionsConfig: {
          usdPrice: usd,
          eurPrice: eurFromUsd(p.priceUsd),
          availability: 'AVAILABLE'
        },
        taxAndComplianceSettings: {
          withdrawalRightType: 'WITHDRAWAL_RIGHT_DIGITAL_CONTENT'
        }
      }
    ],
    regionsVersion: { version: REGIONS_VERSION }
  }
}

function filterProducts() {
  if (!ONLY?.length) return CREDIT_PRODUCTS
  return CREDIT_PRODUCTS.filter(p =>
    ONLY.some(o => p.sku.toLowerCase().includes(o) || p.titleEn.toLowerCase().includes(o))
  )
}

async function main() {
  const products = filterProducts()
  const { androidpublisher, keyFile } = await getAndroidPublisher()
  console.log(`Package: ${PACKAGE_NAME}`)
  console.log(`Key: ${keyFile}`)
  console.log(`Upserting ${products.length} product(s)${DRY_RUN ? ' (dry-run)' : ''}`)

  const requests = products.map(p => ({
    oneTimeProduct: toOneTimeProduct(p),
    updateMask: 'listings,purchaseOptions,taxAndComplianceSettings',
    regionsVersion: { version: REGIONS_VERSION },
    allowMissing: true,
    latencyTolerance: 'PRODUCT_UPDATE_LATENCY_TOLERANCE_LATENCY_TOLERANT'
  }))

  if (DRY_RUN) {
    for (const r of requests) {
      console.log(
        '[dry-run]',
        r.oneTimeProduct.productId,
        r.oneTimeProduct.purchaseOptions[0].regionalPricingAndAvailabilityConfigs[0].price
      )
    }
    return
  }

  const res = await androidpublisher.monetization.onetimeproducts.batchUpdate({
    packageName: PACKAGE_NAME,
    requestBody: { requests }
  })

  const out = res.data.oneTimeProducts || []
  console.log(`\nOK — ${out.length} product(s) returned`)
  for (const p of out) {
    const opt = p.purchaseOptions?.[0]
    const us = opt?.regionalPricingAndAvailabilityConfigs?.find(c => c.regionCode === 'US')
    console.log(
      `✓ ${p.productId}  option=${opt?.purchaseOptionId} state=${opt?.state || 'n/a'} US=${
        us
          ? `${us.price.units}.${String(Math.round((us.price.nanos || 0) / 1e7)).padStart(2, '0')} ${us.price.currencyCode}`
          : '?'
      }`
    )
  }

  const toActivate = out.filter(p => p.purchaseOptions?.[0]?.state !== 'ACTIVE')
  if (toActivate.length) {
    const { google } = await import('googleapis')
    const { resolveCredentialsPath } = await import('./client.mjs')
    const auth = new google.auth.GoogleAuth({
      keyFile: resolveCredentialsPath(),
      scopes: ['https://www.googleapis.com/auth/androidpublisher']
    })
    const client = await auth.getClient()
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/oneTimeProducts/-/purchaseOptions:batchUpdateStates`
    const activateRes = await client.request({
      url,
      method: 'POST',
      data: {
        requests: toActivate.map(p => ({
          activatePurchaseOptionRequest: {
            packageName: PACKAGE_NAME,
            productId: p.productId,
            purchaseOptionId: p.purchaseOptions?.[0]?.purchaseOptionId || 'credit',
            latencyTolerance: 'PRODUCT_UPDATE_LATENCY_TOLERANCE_LATENCY_TOLERANT'
          }
        }))
      }
    })
    console.log('\nActivated:')
    for (const p of activateRes.data.oneTimeProducts || []) {
      console.log(`✓ ${p.productId} → ${p.purchaseOptions?.[0]?.state}`)
    }
  }
}

main().catch(err => {
  console.error(formatApiError(err))
  process.exit(1)
})
