import { FIREBASE_PROJECT_ID, PACKAGE_NAME, BUNDLE_ID } from './catalog.mjs'
import { loadServiceAccount } from './client.mjs'
import { spawnSync } from 'node:child_process'

/**
 * Open Firebase Console pages the human must click.
 * Agents: run this (or `open <url>`) — do NOT Playwright-click ToS / Enable.
 * User: click the labeled buttons; then re-run analytics:status / continue.
 */
function openUrl(url) {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url]
  const bin = process.platform === 'win32' ? 'cmd' : cmd
  spawnSync(bin, args, { stdio: 'ignore' })
  console.log('opened:', url)
}

function main() {
  const { key } = loadServiceAccount()
  const projectId = process.env.FIREBASE_PROJECT_ID || FIREBASE_PROJECT_ID || key.project_id
  const androidPkg = process.env.FIREBASE_ANDROID_PACKAGE || PACKAGE_NAME
  const iosBundle = process.env.FIREBASE_IOS_BUNDLE_ID || BUNDLE_ID

  const only = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1]

  const pages = {
    integrations: {
      url: `https://console.firebase.google.com/project/${projectId}/settings/integrations`,
      click: [
        'Find Google Analytics',
        'Click Enable / Link / Manage',
        'Accept Analytics Terms if prompted',
        'Create or choose a GA4 property → Finish',
      ],
    },
    analyticsAndroid: {
      url: `https://console.firebase.google.com/project/${projectId}/analytics/app/android:${androidPkg}/overview`,
      click: [
        'If you see Enable Google Analytics → click it',
        'Complete the same ToS / property wizard',
      ],
    },
    analyticsIos: {
      url: `https://console.firebase.google.com/project/${projectId}/analytics/app/ios:${iosBundle}/overview`,
      click: [
        'Optional check after Enable — should show Analytics dashboard (not Enable CTA)',
      ],
    },
    cloudMessaging: {
      url: `https://console.firebase.google.com/project/${projectId}/settings/cloudmessaging`,
      click: [
        'iOS only: upload APNs Authentication Key (.p8)',
        'Key ID + Team ID from Apple Developer',
      ],
    },
  }

  const keys = only ? [only] : ['integrations', 'analyticsAndroid', 'cloudMessaging']
  console.log('Human click handoff — agent opens URLs; YOU click.\n')
  for (const k of keys) {
    const page = pages[k]
    if (!page) {
      console.error('Unknown --only=', k, 'options:', Object.keys(pages).join(', '))
      process.exitCode = 1
      return
    }
    console.log(`## ${k}`)
    for (const step of page.click) console.log(`  • ${step}`)
    openUrl(page.url)
    console.log('')
  }
  console.log('When done: pnpm analytics:status')
}

main()
