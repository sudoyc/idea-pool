import Database from 'better-sqlite3'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { IdeaRecord } from './types'

const tempDirs: string[] = []

const createHarness = async () => {
  const dir = mkdtempSync(join(tmpdir(), 'idea-workbench-db-'))
  tempDirs.push(dir)
  process.env.DATABASE_URL = `file:${join(dir, 'module.db')}`
  vi.resetModules()
  const { createWorkbenchRepository, ensureSchema } = await import('./db')
  const database = new Database(join(dir, 'test.db'))
  ensureSchema(database)
  return { database, repository: createWorkbenchRepository(database) }
}

const idea: IdeaRecord = {
  id: 'idea-db-test',
  title: 'DB spine test idea',
  summary: 'A persisted idea used to verify the durable workbench schema.',
  status: 'INBOX',
  source: 'agent',
  tags: ['agent', 'storage'],
  whyNow: 'The agent API needs a stable database contract.',
  mvpScope: 'Persist events, completions, file metadata, and settings.',
  firstAction: 'Write the schema test first.',
  scratchpad: 'red -> green -> refactor',
  aiEnriched: false,
  sortOrder: 10,
  createdAt: '2026-05-29T00:00:00.000Z',
  updatedAt: '2026-05-29T00:00:00.000Z',
  archivedAt: null,
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('workbench database spine', () => {
  it('persists idea events, completion records, file metadata, and JSON settings', async () => {
    const { repository } = await createHarness()

    repository.upsertIdea(idea)

    const event = repository.recordIdeaEvent({
      ideaId: idea.id,
      type: 'agent_read',
      actor: 'agent',
      payload: { endpoint: '/api/agent/v1/ideas/idea-db-test' },
    })
    expect(event.id).toMatch(/^event-/)
    expect(repository.listIdeaEvents(idea.id)).toMatchObject([
      { ideaId: idea.id, type: 'agent_read', actor: 'agent', payload: { endpoint: '/api/agent/v1/ideas/idea-db-test' } },
    ])

    const completion = repository.recordAiCompletion({
      ideaId: idea.id,
      provider: 'local',
      model: 'fallback',
      promptHash: 'prompt-hash',
      input: { ideaId: idea.id },
      output: { mvpSuggestion: 'Keep the schema small.' },
      status: 'succeeded',
    })
    expect(completion.id).toMatch(/^completion-/)
    expect(repository.listAiCompletions(idea.id)[0]).toMatchObject({
      ideaId: idea.id,
      provider: 'local',
      model: 'fallback',
      status: 'succeeded',
      output: { mvpSuggestion: 'Keep the schema small.' },
    })

    const file = repository.createFileMetadata({
      ideaId: idea.id,
      kind: 'agent_pack',
      filename: 'agent-pack.md',
      mimeType: 'text/markdown',
      sizeBytes: 42,
      storageKey: `${idea.id}/file-agent-pack.md`,
      sha256: 'abc123',
    })
    expect(file.id).toMatch(/^file-/)
    expect(repository.listFiles(idea.id)).toMatchObject([
      { ideaId: idea.id, kind: 'agent_pack', filename: 'agent-pack.md', storageKey: `${idea.id}/file-agent-pack.md` },
    ])

    repository.setSetting('workspace.profile', { name: 'Personal Idea Workbench', localFirst: true })
    expect(repository.getSetting('workspace.profile')).toEqual({ name: 'Personal Idea Workbench', localFirst: true })
  })
})
