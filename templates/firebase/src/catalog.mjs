/**
 * Per-app Firebase catalog — edit when copying the template.
 */
export const FIREBASE_PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID || 'your-gcp-project-id'

export const PACKAGE_NAME =
  process.env.FIREBASE_ANDROID_PACKAGE || 'com.example.yourapp'

export const BUNDLE_ID =
  process.env.FIREBASE_IOS_BUNDLE_ID || PACKAGE_NAME

export const DISPLAY_NAME = process.env.FIREBASE_DISPLAY_NAME || 'Your App'

/** Where client configs are written (app repo: config/firebase/). */
export const CONFIG_DIR = new URL('../../../config/firebase/', import.meta.url)

/**
 * EAS Expo account + project slug for FCM V1 push credential upload.
 * Use the **owner org** from app.json `expo.owner` (not personal username).
 * Example: owner appsvoyss-organization + slug quickdoc → @appsvoyss-organization/quickdoc
 */
export const EAS_ACCOUNT_NAME = process.env.EAS_ACCOUNT_NAME || 'your-expo-org'
export const EAS_PROJECT_SLUG = process.env.EAS_PROJECT_SLUG || 'your-app-slug'
