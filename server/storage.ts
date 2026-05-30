import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, relative, resolve } from 'node:path'

const dataDir = () => resolve(process.env.IDEA_POOL_DATA_DIR ?? './data')

export const filesDir = () => resolve(dataDir(), 'files')

const assertStoragePath = (storageKey: string) => {
  const root = filesDir()
  const path = resolve(root, storageKey)
  if (!path.startsWith(`${root}/`)) {
    throw new Error('Invalid storage key')
  }
  return path
}

export const isSafeFilename = (filename: string) =>
  Boolean(filename.trim()) && filename !== '.' && filename !== '..' && basename(filename) === filename && !filename.includes('/') && !filename.includes('\\')

export const writeStoredFile = (storageKey: string, contents: string) => {
  const path = assertStoragePath(storageKey)

  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, contents, 'utf8')

  return {
    sha256: createHash('sha256').update(contents).digest('hex'),
    sizeBytes: Buffer.byteLength(contents, 'utf8'),
  }
}

export const readStoredFile = (storageKey: string) => readFileSync(assertStoragePath(storageKey))

export const deleteStoredFile = (storageKey: string) => {
  rmSync(assertStoragePath(storageKey), { force: true })
}

const collectStorageKeys = (directory: string, root: string, keys: string[]) => {
  if (!existsSync(directory)) return
  for (const entry of readdirSync(directory)) {
    const fullPath = resolve(directory, entry)
    const stats = statSync(fullPath)
    if (stats.isDirectory()) {
      collectStorageKeys(fullPath, root, keys)
      continue
    }
    keys.push(relative(root, fullPath))
  }
}

export const listStoredFileKeys = () => {
  const root = filesDir()
  const keys: string[] = []
  collectStorageKeys(root, root, keys)
  return keys.sort()
}
