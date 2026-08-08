import {
  enableFirebaseApis,
  firebaseFetch,
  getAuthClient,
  pollOperation,
} from './client.mjs'
import {
  BUNDLE_ID,
  DISPLAY_NAME,
  FIREBASE_PROJECT_ID,
  PACKAGE_NAME,
} from './catalog.mjs'

async function ensureFirebaseProject(client, projectId) {
  let r = await firebaseFetch(client, 'GET', `projects/${projectId}`)
  if (r.status === 200) {
    console.log('✓ Firebase already on', projectId)
    return r.json
  }
  if (r.status !== 404) {
    throw new Error(`GET project ${r.status}: ${JSON.stringify(r.json).slice(0, 400)}`)
  }
  console.log('Adding Firebase to GCP project', projectId, '…')
  r = await firebaseFetch(client, 'POST', `projects/${projectId}:addFirebase`, {})
  if (r.status >= 400) {
    throw new Error(`addFirebase ${r.status}: ${JSON.stringify(r.json).slice(0, 600)}`)
  }
  await pollOperation(client, r.json.name, 'addFirebase')
  r = await firebaseFetch(client, 'GET', `projects/${projectId}`)
  if (r.status !== 200) {
    throw new Error(`GET after addFirebase ${r.status}`)
  }
  console.log('✓ Firebase ACTIVE')
  return r.json
}

async function ensureAndroid(client, projectId) {
  const list = await firebaseFetch(client, 'GET', `projects/${projectId}/androidApps`)
  const existing = (list.json.apps || []).find((a) => a.packageName === PACKAGE_NAME)
  if (existing) {
    console.log('✓ Android app exists', existing.appId)
    return existing
  }
  console.log('Creating Android app', PACKAGE_NAME, '…')
  const cr = await firebaseFetch(client, 'POST', `projects/${projectId}/androidApps`, {
    displayName: DISPLAY_NAME,
    packageName: PACKAGE_NAME,
  })
  if (cr.status >= 400) {
    throw new Error(`android create ${cr.status}: ${JSON.stringify(cr.json).slice(0, 600)}`)
  }
  await pollOperation(client, cr.json.name, 'androidCreate')
  const list2 = await firebaseFetch(client, 'GET', `projects/${projectId}/androidApps`)
  const app = (list2.json.apps || []).find((a) => a.packageName === PACKAGE_NAME)
  console.log('✓ Android created', app?.appId)
  return app
}

async function ensureIos(client, projectId) {
  const list = await firebaseFetch(client, 'GET', `projects/${projectId}/iosApps`)
  const existing = (list.json.apps || []).find((a) => a.bundleId === BUNDLE_ID)
  if (existing) {
    console.log('✓ iOS app exists', existing.appId)
    return existing
  }
  console.log('Creating iOS app', BUNDLE_ID, '…')
  const cr = await firebaseFetch(client, 'POST', `projects/${projectId}/iosApps`, {
    displayName: DISPLAY_NAME,
    bundleId: BUNDLE_ID,
  })
  if (cr.status >= 400) {
    throw new Error(`ios create ${cr.status}: ${JSON.stringify(cr.json).slice(0, 600)}`)
  }
  await pollOperation(client, cr.json.name, 'iosCreate')
  const list2 = await firebaseFetch(client, 'GET', `projects/${projectId}/iosApps`)
  const app = (list2.json.apps || []).find((a) => a.bundleId === BUNDLE_ID)
  console.log('✓ iOS created', app?.appId)
  return app
}

async function main() {
  const { auth, client, key } = await getAuthClient()
  const projectId = FIREBASE_PROJECT_ID || key.project_id
  console.log('project:', projectId)
  console.log('package:', PACKAGE_NAME, 'bundle:', BUNDLE_ID)

  await enableFirebaseApis(projectId, auth)
  await ensureFirebaseProject(client, projectId)
  await ensureAndroid(client, projectId)
  await ensureIos(client, projectId)
  console.log('Done. Next: pnpm configs:download')
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
