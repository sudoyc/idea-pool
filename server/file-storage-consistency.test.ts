import Database from 'better-sqlite3'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { writeStoredFile, listStoredFileKeys } from './storage'
import type { IdeaRecord } from './types'

const tempDirs: string[] = []

const idea: IdeaRecord = {
  id: 'file-consistency-idea',
  title: 'File consistency idea',
  summary: 'Verify metadata and disk files agree.',
  status: 'INBOX',
  source: 'local',
  tags: [],
  whyNow: 'Agent handoff files must be durable.',
  scratchpad: '',
  aiEnriched: false,
  sortOrder: 1,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  archivedAt: null,
}

const createHarness = async () => {
  const dir = mkdtempSync(join(tmpdir(), 'idea-workbench-file-consistency-'))
  tempDirs.push(dir)
  process.env.DATABASE_URL = `file:${join(dir, 'module.db')}`
  process.env.IDEA_POOL_DATA_DIR = dir
  vi.resetModules()
  const { createWorkbenchRepository, ensureSchema } = await import('./db')
  const database = new Database(join(dir, 'files.db'))
  ensureSchema(database)
  const repository = createWorkbenchRepository(database)
  repository.upsertIdea(idea)
  return { repository }
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('file storage consistency reporting', () => {
  it('reports missing disk content and untracked disk files without destructive cleanup', async () => {
    const { repository } = await createHarness()

    writeStoredFile(`${idea.id}/tracked.md`, '# tracked')
    writeStoredFile(`${idea.id}/orphan.md`, '# orphan')
    const tracked = repository.createFileMetadata({ ideaId: idea.id, kind: 'markdown', filename: 'tracked.md', storageKey: `${idea.id}/tracked.md`, sizeBytes: 9 })
    const missing = repository.createFileMetadata({ ideaId: idea.id, kind: 'markdown', filename: 'missing.md', storageKey: `${idea.id}/missing.md`, sizeBytes: 9 })

    const report = repository.getFileConsistencyReport(listStoredFileKeys())

    expect(report).toEqual({
      checkedAt: expect.any(String),
      ok: false,
      missingDiskFiles: [expect.objectContaining({ id: missing.id, storageKey: `${idea.id}/missing.md` })],
      untrackedStorageKeys: [`${idea.id}/orphan.md`],
    })
    expect(repository.getFile(tracked.id)).toMatchObject({ id: tracked.id, storageKey: `${idea.id}/tracked.md` })
    expect(repository.getFile(missing.id)).toMatchObject({ id: missing.id, storageKey: `${idea.id}/missing.md` })
    expect(listStoredFileKeys()).toContain(`${idea.id}/orphan.md`)
  })
})
