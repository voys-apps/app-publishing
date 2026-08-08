/**
 * Paths relative to the app repo root (scripts/play-console lives at scripts/play-console).
 * Edit per app; keep files at these paths or change the list.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const PROJECT_ROOT = path.resolve(__dirname, '../../..')
const ASSETS_DIR = path.join(PROJECT_ROOT, 'assets')
const PLAY_ASSETS_DIR = path.join(ASSETS_DIR, 'play-store')

/**
 * @typedef {{ imageType: 'icon' | 'featureGraphic' | 'phoneScreenshots', file: string, replace: boolean }} StoreAsset
 * @type {StoreAsset[]}
 */
export const STORE_ASSETS = [
  {
    imageType: 'icon',
    file: path.join(ASSETS_DIR, 'images/app-icons/playstore.png'),
    replace: true
  },
  {
    imageType: 'featureGraphic',
    file: path.join(PLAY_ASSETS_DIR, 'feature-graphic.png'),
    replace: true
  },
  {
    imageType: 'phoneScreenshots',
    file: path.join(PLAY_ASSETS_DIR, 'screenshot-1.png'),
    replace: true
  },
  {
    imageType: 'phoneScreenshots',
    file: path.join(PLAY_ASSETS_DIR, 'screenshot-2.png'),
    replace: false
  },
  {
    imageType: 'phoneScreenshots',
    file: path.join(PLAY_ASSETS_DIR, 'screenshot-3.png'),
    replace: false
  }
]
