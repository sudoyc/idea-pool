import Database from 'better-sqlite3'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ideaEventTypes, type IdeaRecord } from './types'

const tempDirs: string[] = []

const idea: IdeaRecord = {
  id: 'evented-idea',
  title: 'Evented idea',
  summary: 'Verify formal event history.',
  status: 'INBOX',
  source: 'local',
  tags: [],
  whyNow: 'The detail view needs trustworthy history.',
  scratchpad: '',
  aiEnriched: false,
  sortOrder: 1,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  archivedAt: null,
}

const createHarness = async () => {
  const dir = mkdtempSync(join(tmpdir(), 'idea-workbench-events-'))
  tempDirs.push(dir)
  process.env.DATABASE_URL = `file:${join(dir, 'module.db')}`
  vi.resetModules()
  const { createWorkbenchRepository, ensureSchema } = await import('./db')
  const database = new Database(join(dir, 'events.db'))
  ensureSchema(database)
  const repository = createWorkbenchRepository(database)
  repository.upsertIdea(idea)
  return { repository }
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('formal idea event history', () => {
  it('exports the stable event taxonomy required by local UI, LLM, agent, and files', () => {
    expect(ideaEventTypes).toEqual([
      'idea_created',
      'idea_updated',
      'idea_status_changed',
      'idea_archived',
      'idea_deleted',
      'file_uploaded',
      'file_deleted',
      'ai_completion_requested',
      'ai_completion_succeeded',
      'ai_completion_failed',
      'agent_pack_created',
    ])
  })

  it('records typed status transitions with previous/new status and rejects ad hoc event names', async () => {
    const { repository } = await createHarness()

    expect(() => repository.recordIdeaEvent({ ideaId: idea.id, type: 'updated', actor: 'agent' })).toThrow(/unknown event type/i)

    const updated = repository.patchIdeaWithEvent(idea.id, { status: 'PIPELINE' }, { actor: 'agent' })

    expect(updated).toMatchObject({ id: idea.id, status: 'PIPELINE' })
    expect(repository.listIdeaEvents(idea.id)).toMatchObject([
      {
        ideaId: idea.id,
        type: 'idea_status_changed',
        actor: 'agent',
        payload: { previousStatus: 'INBOX', newStatus: 'PIPELINE', changedFields: ['status'] },
      },
    ])
  })
})
