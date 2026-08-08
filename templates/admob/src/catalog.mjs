export const APP_DISPLAY_NAME = process.env.APP_DISPLAY_NAME || 'Your App'

export const ANDROID_PACKAGE =
  process.env.ANDROID_PACKAGE || 'com.example.app'

export const IOS_BUNDLE_ID =
  process.env.IOS_BUNDLE_ID || 'com.example.app'

export const PRIVACY_URL =
  process.env.AUTH_PRIVACY_URL || 'https://voysapps.io/app/yourapp/privacy-policy'

/** Chrome profile dir, e.g. Profile 4. Empty = default `open`. */
export const CHROME_PROFILE_DIRECTORY =
  process.env.CHROME_PROFILE_DIRECTORY || ''
