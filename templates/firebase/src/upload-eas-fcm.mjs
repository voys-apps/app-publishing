import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { google } from 'googleapis'
import {
  getAuthClient,
  loadServiceAccount,
  resolveCredentialsPath,
} from './client.mjs'
import {
  EAS_ACCOUNT_NAME,
  EAS_PROJECT_SLUG,
  FIREBASE_PROJECT_ID,
  PACKAGE_NAME,
} from './catalog.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const GQL = 'https://api.expo.dev/graphql'

/**
 * Resolve Expo auth: EXPO_TOKEN (CI) or ~/.expo/state.json session (local eas login).
 */
function resolveExpoAuth() {
  if (process.env.EXPO_TOKEN) {
    return { accessToken: process.env.EXPO_TOKEN, sessionSecret: null }
  }
  const statePath = path.join(os.homedir(), '.expo/state.json')
  if (!fs.existsSync(statePath)) {
    throw new Error(
      'No EXPO_TOKEN and no ~/.expo/state.json — run `eas login` or set EXPO_TOKEN',
    )
  }
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'))
  const sessionSecret = state.auth?.sessionSecret
  if (!sessionSecret) {
    throw new Error('~/.expo/state.json has no session — run `eas login`')
  }
  return { accessToken: null, sessionSecret }
}

async function gql(auth, query, variables = {}) {
  const headers = { 'content-type': 'application/json' }
  if (auth.accessToken) headers.authorization = `Bearer ${auth.accessToken}`
  else headers['expo-session'] = auth.sessionSecret

  const res = await fetch(GQL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors?.length) {
    throw new Error(JSON.stringify(json.errors, null, 2))
  }
  return json.data
}

async function ensureFcmServiceAccountKey({ projectId, keyFile }) {
  const outPath =
    process.env.FCM_EXPO_PUSH_KEY_JSON ||
    path.join(ROOT, 'secrets/fcm-expo-push-service-account.json')

  if (fs.existsSync(outPath) && !process.env.FCM_FORCE_NEW_KEY) {
    console.log('Reusing existing FCM key file:', outPath)
    return JSON.parse(fs.readFileSync(outPath, 'utf8'))
  }

  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  })
  const authClient = await auth.getClient()
  const iam = google.iam({ version: 'v1', auth: authClient })
  const crm = google.cloudresourcemanager({ version: 'v1', auth: authClient })

  const accountId = process.env.FCM_SA_ACCOUNT_ID || 'app-fcm'
  const fcmEmail = `${accountId}@${projectId}.iam.gserviceaccount.com`
  const fcmSaName = `projects/${projectId}/serviceAccounts/${fcmEmail}`

  try {
    await iam.projects.serviceAccounts.get({ name: fcmSaName })
    console.log('✓ FCM SA exists', fcmEmail)
  } catch {
    console.log('Creating FCM SA', fcmEmail, '…')
    await iam.projects.serviceAccounts.create({
      name: `projects/${projectId}`,
      requestBody: {
        accountId,
        serviceAccount: {
          displayName: 'Expo Push FCM V1',
          description: 'Firebase Cloud Messaging API Admin for EAS Expo Push',
        },
      },
    })
  }

  const role = 'roles/firebasecloudmessaging.admin'
  const member = `serviceAccount:${fcmEmail}`
  const policy = await crm.projects.getIamPolicy({
    resource: projectId,
    requestBody: {},
  })
  const bindings = policy.data.bindings || []
  let b = bindings.find((x) => x.role === role)
  if (!b) bindings.push({ role, members: [member] })
  else if (!b.members.includes(member)) b.members.push(member)
  await crm.projects.setIamPolicy({
    resource: projectId,
    requestBody: { policy: { ...policy.data, bindings } },
  })
  console.log('✓ IAM', role)

  const keyRes = await iam.projects.serviceAccounts.keys.create({
    name: fcmSaName,
    requestBody: { privateKeyType: 'TYPE_GOOGLE_CREDENTIALS_FILE' },
  })
  const fcmJson = JSON.parse(
    Buffer.from(keyRes.data.privateKeyData, 'base64').toString('utf8'),
  )
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(fcmJson, null, 2))
  console.log('✓ Wrote', outPath, '(gitignored)')
  return fcmJson
}

async function main() {
  const accountName = process.env.EAS_ACCOUNT_NAME || EAS_ACCOUNT_NAME
  const projectSlug = process.env.EAS_PROJECT_SLUG || EAS_PROJECT_SLUG
  if (!accountName || !projectSlug || accountName.includes('example')) {
    throw new Error(
      'Set EAS_ACCOUNT_NAME + EAS_PROJECT_SLUG in catalog.mjs (org slug, not personal username)',
    )
  }
  const fullName = `@${accountName}/${projectSlug}`
  const packageName = process.env.FIREBASE_ANDROID_PACKAGE || PACKAGE_NAME

  const { keyFile, key } = loadServiceAccount()
  const projectId = process.env.FIREBASE_PROJECT_ID || FIREBASE_PROJECT_ID || key.project_id

  console.log('GCP project:', projectId)
  console.log('EAS app:', fullName)
  console.log('Android package:', packageName)

  const fcmJson = await ensureFcmServiceAccountKey({ projectId, keyFile })
  const expoAuth = resolveExpoAuth()

  const me = await gql(
    expoAuth,
    `query { me { accounts { id name } } }`,
  )
  const account = me.me.accounts.find((a) => a.name === accountName)
  if (!account) {
    throw new Error(
      `Expo account "${accountName}" not in session. Available: ${me.me.accounts
        .map((a) => a.name)
        .join(', ')}`,
    )
  }

  const appData = await gql(
    expoAuth,
    `query ($fullName: String!) {
      app { byFullName(fullName: $fullName) { id fullName } }
    }`,
    { fullName },
  )
  const app = appData.app.byFullName
  if (!app) throw new Error(`EAS app not found: ${fullName}`)

  const credsQ = await gql(
    expoAuth,
    `query ($fullName: String!, $applicationIdentifier: String!) {
      app {
        byFullName(fullName: $fullName) {
          androidAppCredentials(
            filter: { applicationIdentifier: $applicationIdentifier, legacyOnly: false }
          ) {
            id
            googleServiceAccountKeyForFcmV1 { id clientEmail projectIdentifier }
          }
        }
      }
    }`,
    { fullName, applicationIdentifier: packageName },
  )

  let androidCreds = credsQ.app.byFullName.androidAppCredentials?.[0]
  if (androidCreds?.googleServiceAccountKeyForFcmV1) {
    console.log(
      'Replacing previous FCM V1 key:',
      androidCreds.googleServiceAccountKeyForFcmV1.clientEmail,
      androidCreds.googleServiceAccountKeyForFcmV1.projectIdentifier,
    )
  }

  if (!androidCreds) {
    const created = await gql(
      expoAuth,
      `mutation ($appId: ID!, $applicationIdentifier: String!) {
        androidAppCredentials {
          createAndroidAppCredentials(
            androidAppCredentialsInput: {}
            appId: $appId
            applicationIdentifier: $applicationIdentifier
          ) { id }
        }
      }`,
      { appId: app.id, applicationIdentifier: packageName },
    )
    androidCreds = created.androidAppCredentials.createAndroidAppCredentials
  }

  const createdKey = await gql(
    expoAuth,
    `mutation ($accountId: ID!, $jsonKey: JSONObject!) {
      googleServiceAccountKey {
        createGoogleServiceAccountKey(
          accountId: $accountId
          googleServiceAccountKeyInput: { jsonKey: $jsonKey }
        ) { id clientEmail projectIdentifier }
      }
    }`,
    { accountId: account.id, jsonKey: fcmJson },
  )
  const gsa = createdKey.googleServiceAccountKey.createGoogleServiceAccountKey
  console.log('✓ Uploaded GSAK', gsa.clientEmail)

  const assigned = await gql(
    expoAuth,
    `mutation ($androidAppCredentialsId: ID!, $googleServiceAccountKeyId: ID!) {
      androidAppCredentials {
        setGoogleServiceAccountKeyForFcmV1(
          id: $androidAppCredentialsId
          googleServiceAccountKeyId: $googleServiceAccountKeyId
        ) {
          googleServiceAccountKeyForFcmV1 { id clientEmail projectIdentifier }
        }
      }
    }`,
    {
      androidAppCredentialsId: androidCreds.id,
      googleServiceAccountKeyId: gsa.id,
    },
  )

  const final =
    assigned.androidAppCredentials.setGoogleServiceAccountKeyForFcmV1
      .googleServiceAccountKeyForFcmV1
  console.log('✓ FCM V1 assigned on EAS:', final)
  console.log(
    `Dashboard: https://expo.dev/accounts/${accountName}/projects/${projectSlug}/credentials`,
  )
  console.log(
    'Note: eas credentials is interactive-only; this script uses Expo GraphQL instead.',
  )
}

main().catch((err) => {
  console.error(err.message || err)
  process.exitCode = 1
})
