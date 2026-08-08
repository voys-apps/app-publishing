import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { firebaseFetch, getAuthClient } from './client.mjs'
import {
  BUNDLE_ID,
  CONFIG_DIR,
  FIREBASE_PROJECT_ID,
  PACKAGE_NAME,
} from './catalog.mjs'

async function writeConfig(client, appName, outFile) {
  const cfg = await firebaseFetch(client, 'GET', `${appName}/config`)
  if (cfg.status !== 200) {
    throw new Error(`config ${appName}: ${cfg.status} ${JSON.stringify(cfg.json).slice(0, 400)}`)
  }
  const buf = Buffer.from(cfg.json.configFileContents, 'base64')
  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  fs.writeFileSync(outFile, buf)
  console.log(`✓ Wrote ${outFile} (${buf.length} bytes, ${cfg.json.configFilename})`)
}

async function main() {
  const { client, key } = await getAuthClient()
  const projectId = FIREBASE_PROJECT_ID || key.project_id

  const androidList = await firebaseFetch(client, 'GET', `projects/${projectId}/androidApps`)
  const iosList = await firebaseFetch(client, 'GET', `projects/${projectId}/iosApps`)
  const android = (androidList.json.apps || []).find((a) => a.packageName === PACKAGE_NAME)
  const ios = (iosList.json.apps || []).find((a) => a.bundleId === BUNDLE_ID)

  if (!android || !ios) {
    throw new Error('Apps missing — run pnpm provision first')
  }

  const configDir = fileURLToPath(CONFIG_DIR)
  await writeConfig(
    client,
    android.name,
    path.join(configDir, 'google-services.json'),
  )
  await writeConfig(
    client,
    ios.name,
    path.join(configDir, 'GoogleService-Info.plist'),
  )
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
