/**
 * Project-specific Play catalog — edit these for each app.
 * Copy this template into your app repo as scripts/play-console/src/catalog.mjs
 */

export const PACKAGE_NAME = 'com.example.yourapp'

/** @typedef {{ sku: string, titleEn: string, descEn: string, titleTr: string, descTr: string, priceUsd: string }} CreditProduct */

/** One-time credit packs (consumable; API type = managedUser). */
/** @type {CreditProduct[]} */
export const CREDIT_PRODUCTS = [
  {
    sku: 'com.example.yourapp.credits10k',
    titleEn: '10K Credits',
    descEn: '10,000 credits. One-time purchase; credits added to your balance.',
    titleTr: '10K Kredi',
    descTr: '10.000 kredi. Tek seferlik; bakiyene eklenir.',
    priceUsd: '4.99'
  },
  {
    sku: 'com.example.yourapp.credits25k',
    titleEn: '25K Credits',
    descEn: '25,000 credits. One-time purchase; credits added to your balance.',
    titleTr: '25K Kredi',
    descTr: '25.000 kredi. Tek seferlik; bakiyene eklenir.',
    priceUsd: '9.99'
  }
]

/** Subscriptions (monetization API: productId + basePlanId). */
export const SUBSCRIPTIONS = [
  {
    productId: 'com.example.yourapp.pro.monthly',
    basePlanId: 'monthly',
    billingPeriodDuration: 'P1M',
    titleEn: 'Monthly Pro',
    descEn: 'Pro features billed monthly.',
    titleTr: 'Aylık Pro',
    descTr: 'Pro özellikler, aylık faturalandırma.',
    priceUsd: '4.99'
  },
  {
    productId: 'com.example.yourapp.pro.yearly',
    basePlanId: 'yearly',
    billingPeriodDuration: 'P1Y',
    titleEn: 'Yearly Pro',
    descEn: 'Pro features billed yearly. Save vs monthly.',
    titleTr: 'Yıllık Pro',
    descTr: 'Pro özellikler, yıllık faturalandırma. Aylığa göre indirimli.',
    priceUsd: '49.99'
  }
]

/** @param {string} usd e.g. "4.99" */
export function usdToMicros(usd) {
  const n = Number(usd)
  if (!Number.isFinite(n) || n <= 0) throw new Error(`Invalid USD price: ${usd}`)
  return String(Math.round(n * 1_000_000))
}
