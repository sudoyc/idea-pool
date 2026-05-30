import Database from 'better-sqlite3'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const tempDirs: string[] = []

const createLegacyDatabase = async () => {
  const dir = mkdtempSync(join(tmpdir(), 'idea-workbench-schema-version-'))
  tempDirs.push(dir)
  process.env.DATABASE_URL = `file:${join(dir, 'module.db')}`
  vi.resetModules()
  const database = new Database(join(dir, 'legacy.db'))
  database.exec(`
    CREATE TABLE ideas (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'INBOX',
      tags_json TEXT NOT NULL DEFAULT '[]',
      why_now TEXT NOT NULL DEFAULT '',
      scratchpad TEXT NOT NULL DEFAULT '',
      ai_enriched INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)
  database.prepare(
    `INSERT INTO ideas (id, title, summary, status, tags_json, why_now, scratchpad, ai_enriched, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run('legacy-idea', 'Legacy idea', 'Migrated from an older local DB.', 'INBOX', '[]', 'Do not lose this idea.', '', 0, '2026-05-01T00:00:00.000Z', '2026-05-01T00:00:00.000Z')

  const dbModule = await import('./db')
  return { database, ...dbModule }
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('database schema metadata and migration contract', () => {
  it('migrates legacy local databases idempotently while preserving ideas and recording schema metadata', async () => {
    const { database, createWorkbenchRepository, ensureSchema } = await createLegacyDatabase()

    ensureSchema(database)
    ensureSchema(database)
    const repository = createWorkbenchRepository(database)

    expect(repository.getIdea('legacy-idea')).toMatchObject({ id: 'legacy-idea', title: 'Legacy idea', source: 'local' })
    expect(repository.getSchemaMetadata()).toMatchObject({
      appSchemaVersion: 3,
      settingsSchemaVersion: 2,
      product: 'Personal Idea Workbench',
    })
    expect(typeof repository.getSchemaMetadata().migratedAt).toBe('string')
  })
})
