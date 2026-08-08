export const SUPABASE_PROJECT_REF =
  process.env.SUPABASE_PROJECT_REF || 'your-project-ref'

export const APP_SCHEME = process.env.APP_SCHEME || 'yourapp'

export const GCP_PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GCP_PROJECT_ID ||
  'your-gcp-project-id'

export const APP_DISPLAY_NAME = process.env.APP_DISPLAY_NAME || 'Your App'

export const PRIVACY_URL =
  process.env.AUTH_PRIVACY_URL || 'https://voysapps.io/yourapp/privacy-policy'

export const HOME_URL =
  process.env.AUTH_HOME_URL || 'https://voysapps.io/yourapp'

export function supabaseCallbackUrl(ref = SUPABASE_PROJECT_REF) {
  return `https://${ref}.supabase.co/auth/v1/callback`
}

export function appOAuthCallback(scheme = APP_SCHEME) {
  return `${scheme}://auth/oauth-callback`
}
