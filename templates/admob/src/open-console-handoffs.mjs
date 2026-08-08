import { spawnSync } from 'node:child_process'
import {
  ANDROID_PACKAGE,
  APP_DISPLAY_NAME,
  CHROME_PROFILE_DIRECTORY,
  IOS_BUNDLE_ID,
  PRIVACY_URL,
} from './catalog.mjs'

function openUrl(url) {
  const profile = process.env.CHROME_PROFILE_DIRECTORY || CHROME_PROFILE_DIRECTORY
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  if (profile && process.platform === 'darwin') {
    spawnSync(chrome, ['--profile-directory=' + profile, url], {
      stdio: 'ignore',
    })
  } else {
    const cmd = process.platform === 'darwin' ? 'open' : 'xdg-open'
    spawnSync(cmd, [url], { stdio: 'ignore' })
  }
  console.log('opened:', url)
}

const only = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1]

const pages = {
  appsList: {
    url: 'https://apps.admob.com/v2/apps/list',
    click: ['Confirm AdMob account (already signed in — do not re-login)'],
  },
  appsCreate: {
    url: 'https://apps.admob.com/v2/apps/create',
    click: [
      `Display name: ${APP_DISPLAY_NAME}`,
      `Android package: ${ANDROID_PACKAGE}`,
      `iOS bundle: ${IOS_BUNDLE_ID}`,
      `Privacy if asked: ${PRIVACY_URL}`,
      'Create → copy App ID (ca-app-pub-…~…)',
      'Add ad units: Banner, Native, Rewarded → copy unit IDs',
    ],
  },
}

const keys = only ? [only] : ['appsList', 'appsCreate']

console.log('AdMob handoff — open pages only; paste keys in chat.\n')
console.log(`Android: ${ANDROID_PACKAGE}`)
console.log(`iOS:     ${IOS_BUNDLE_ID}`)
if (process.env.CHROME_PROFILE_DIRECTORY || CHROME_PROFILE_DIRECTORY) {
  console.log('Chrome profile:', process.env.CHROME_PROFILE_DIRECTORY || CHROME_PROFILE_DIRECTORY)
}
console.log('')

for (const k of keys) {
  const p = pages[k]
  if (!p) {
    console.error('Unknown', k)
    process.exitCode = 1
    continue
  }
  console.log(`## ${k}`)
  for (const line of p.click) console.log(`  - ${line}`)
  openUrl(p.url)
  console.log('')
}

console.log('When done, send these env values:')
console.log(`
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=
EXPO_PUBLIC_ADMOB_IOS_APP_ID=
EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID=
EXPO_PUBLIC_ADMOB_IOS_BANNER_ID=
EXPO_PUBLIC_ADMOB_ANDROID_NATIVE_ID=
EXPO_PUBLIC_ADMOB_IOS_NATIVE_ID=
EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID=
EXPO_PUBLIC_ADMOB_IOS_REWARDED_ID=
`)
