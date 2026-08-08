import {
  enableFirebaseApis,
  firebaseFetch,
  getAuthClient,
  loadServiceAccount,
} from './client.mjs'
import { FIREBASE_PROJECT_ID } from './catalog.mjs'

async function main() {
  const { keyFile, key, projectIdFromKey } = loadServiceAccount()
  const projectId = FIREBASE_PROJECT_ID || projectIdFromKey
  console.log('key:', keyFile)
  console.log('SA:', key.client_email)
  console.log('project:', projectId)

  const { auth, client } = await getAuthClient()
  await enableFirebaseApis(projectId, auth)

  const r = await firebaseFetch(client, 'GET', `projects/${projectId}`)
  if (r.status === 404) {
    console.log('Firebase not added yet (404). Run: pnpm provision')
    process.exitCode = 2
    return
  }
  if (r.status !== 200) {
    console.error('GET project failed', r.status, JSON.stringify(r.json).slice(0, 400))
    process.exitCode = 1
    return
  }

  console.log('✓ Firebase project ACTIVE:', r.json.projectId, r.json.displayName)

  const android = await firebaseFetch(client, 'GET', `projects/${projectId}/androidApps`)
  const ios = await firebaseFetch(client, 'GET', `projects/${projectId}/iosApps`)
  console.log('Android apps:', (android.json.apps || []).length)
  console.log('iOS apps:', (ios.json.apps || []).length)

  const analytics = await firebaseFetch(
    client,
    'GET',
    `projects/${projectId}/analyticsDetails`,
  )
  if (analytics.status === 200) {
    console.log('✓ Analytics linked:', JSON.stringify(analytics.json).slice(0, 300))
  } else {
    console.log('⚠ Analytics not linked yet — pnpm analytics:status')
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
