/**
 * Project-specific store listing — edit for each app.
 * Play limits: title ≤30, shortDescription ≤80, fullDescription ≤4000 (Unicode code points).
 */

export const PACKAGE_NAME = 'com.example.yourapp'

export const STORE_LISTINGS = {
  'en-US': {
    title: 'Your App Name',
    shortDescription: 'Short pitch ≤80 chars. What the app does in one line.',
    fullDescription: `Full store description (≤4000 chars).

FEATURES
• Feature one
• Feature two

SUBSCRIPTIONS & IAP
Optional subscriptions renew automatically unless canceled at least 24 hours
before the period ends. Manage in Google Play → Subscriptions.

Privacy Policy: https://example.com/privacy
Terms of Use: https://example.com/terms
Support: https://example.com/support`,
    video: ''
  },
  'tr-TR': {
    title: 'Uygulama Adı',
    shortDescription: 'Kısa tanıtım ≤80 karakter. Uygulama ne yapıyor?',
    fullDescription: `Tam mağaza açıklaması (≤4000 karakter).

ÖZELLİKLER
• Özellik bir
• Özellik iki

ABONELİK VE SATIN ALIMLAR
İsteğe bağlı abonelikler, dönem bitiminden en az 24 saat önce iptal edilmezse
otomatik yenilenir. Yönetmek için Google Play → Abonelikler.

Gizlilik Politikası: https://example.com/privacy
Kullanım Koşulları: https://example.com/terms
Destek: https://example.com/support`,
    video: ''
  }
}

export const APP_DETAILS = {
  defaultLanguage: 'en-US',
  contactEmail: 'support@example.com',
  contactWebsite: 'https://example.com/support',
  contactPhone: ''
}

/** Validate Play limits; throws if over. */
export function assertListingLimits(lang, listing) {
  const checks = [
    ['title', listing.title, 30],
    ['shortDescription', listing.shortDescription, 80],
    ['fullDescription', listing.fullDescription, 4000]
  ]
  for (const [field, value, max] of checks) {
    const len = [...(value || '')].length
    if (len > max) {
      throw new Error(`${lang} ${field} is ${len} chars (max ${max})`)
    }
  }
}
