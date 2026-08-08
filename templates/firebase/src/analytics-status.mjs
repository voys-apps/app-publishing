import { spawnSync } from 'node:child_process'
import { firebaseFetch, getAuthClient } from './client.mjs'
import { FIREBASE_PROJECT_ID, PACKAGE_NAME } from './catalog.mjs'

function openUrl(url) {
  const cmd = process.platform === 'darwin' ? 'open' : 'xdg-open'
  spawnSync(cmd, [url], { stdio: 'ignore' })
}

async function main() {
  const { client, key } = await getAuthClient()
  const projectId = FIREBASE_PROJECT_ID || key.project_id
  const shouldOpen = process.argv.includes('--open')

  const details = await firebaseFetch(
    client,
    'GET',
    `projects/${projectId}/analyticsDetails`,
  )

  if (details.status === 200) {
    console.log('✓ Google Analytics linked')
    console.log(JSON.stringify(details.json, null, 2))
    return
  }

  const integrations = `https://console.firebase.google.com/project/${projectId}/settings/integrations`
  const analyticsApp = `https://console.firebase.google.com/project/${projectId}/analytics/app/android:${PACKAGE_NAME}/overview`

  console.log('⚠ Analytics not linked (HTTP', details.status + ')')
  console.log(JSON.stringify(details.json).slice(0, 400))
  console.log('')
  console.log('API cannot accept first-time Analytics ToS.')
  console.log('Agent opens URLs; YOU click Enable:')
  console.log('')
  console.log('1)', integrations)
  console.log('   → Google Analytics → Enable / Link → accept ToS → choose/create GA4 property')
  console.log('2)', analyticsApp)
  console.log('   → if still shown, click Enable Google Analytics')
  console.log('')
  console.log('Or: pnpm console:open')
  console.log('After clicking: pnpm analytics:status')

  if (shouldOpen) {
    openUrl(integrations)
    openUrl(analyticsApp)
    console.log('(opened in browser)')
  }
  process.exitCode = 2
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
