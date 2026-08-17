/**
 * Project-specific App Store Connect metadata.
 * Replace placeholders before running metadata:upsert.
 *
 * Locales must match ASC identifiers (en-US, tr, es-ES, …).
 */
import { codePointLength } from './client.mjs'

/** @type {string} */
export const BUNDLE_ID =
  process.env.ASC_BUNDLE_ID?.trim() || 'com.example.yourapp'

/**
 * @typedef {{
 *   whatsNew?: string
 *   promotionalText?: string
 *   description?: string
 *   keywords?: string
 *   supportUrl?: string
 *   marketingUrl?: string
 * }} LocalizationRow
 */

/** @type {Record<string, LocalizationRow>} */
export const TESTFLIGHT_BUILD_LOCALIZATIONS = {
  'en-US': {
    whatsNew: 'What testers should focus on in this build (EN).'
  },
  tr: {
    whatsNew: 'Bu buildde test edilmesi gerekenler (TR).'
  }
}

/** @type {Record<string, LocalizationRow>} */
export const VERSION_LOCALIZATIONS = {
  'en-US': {
    whatsNew: [
      '- Improved onboarding and session stability.',
      '- Bug fixes and performance improvements.'
    ].join('\n'),
    promotionalText:
      'AI-powered tools in seconds. Upgrade for advanced features and an ad-free experience.'
  },
  tr: {
    whatsNew: [
      '- Başlangıç akışı ve oturum kararlılığı iyileştirildi.',
      '- Hata düzeltmeleri ve performans iyileştirmeleri.'
    ].join('\n'),
    promotionalText:
      'Yapay zeka ile saniyeler içinde. Gelişmiş özellikler ve reklamsız deneyim için yükseltin.'
  }
}

/**
 * App Review Information (optional). Do not commit real demo passwords.
 * @type {{
 *   notes?: string
 *   demoAccountName?: string
 *   demoAccountPassword?: string
 *   demoAccountRequired?: boolean
 * } | null}
 */
export const REVIEW = {
  notes: [
    'Please use the test account below for App Review.',
    '',
    'Test Account (Free):',
    'Email: review@example.com',
    'Password: replace-me-locally'
  ].join('\n'),
  demoAccountRequired: true,
  demoAccountName: 'review@example.com',
  demoAccountPassword: 'replace-me-locally'
}

const LIMITS = {
  promotionalText: 170,
  whatsNew: 4000,
  description: 4000,
  keywords: 100
}

/**
 * @param {string} locale
 * @param {LocalizationRow} row
 */
export function assertMetadataLimits(locale, row) {
  for (const [field, max] of Object.entries(LIMITS)) {
    const value = row[field]
    if (value == null || value === '') continue
    const n = codePointLength(value)
    if (n > max) {
      throw new Error(`${locale}.${field} is ${n} code points (max ${max})`)
    }
  }
}
