import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'

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
