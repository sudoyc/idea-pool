import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

type BackupManifest = {
  schemaVersion: number
  product: string
  exportedAt: string
  settings: Record<string, unknown>
  ideas: Array<Record<string, unknown>>
  ideaEvents: Array<Record<string, unknown>>
  aiCompletions: Array<Record<string, unknown>>
  files: Array<Record<string, unknown>>
  boundaries: Record<string, unknown>
}

const tempDirs: string[] = []

const createHarness = async (name: string) => {
  const dir = mkdtempSync(join(tmpdir(), `idea-workbench-export-restore-${name}-`))
  tempDirs.push(dir)
  process.env.DATABASE_URL = `file:${join(dir, 'module.db')}`
  process.env.IDEA_POOL_DATA_DIR = dir
  process.env.IDEA_POOL_AUTH_ENABLED = 'true'
  process.env.IDEA_POOL_TOKEN = 'agent-token'
  process.env.IDEA_POOL_PASSWORD = 'ui-password'
  process.env.IDEA_POOL_SESSION_SECRET = 'test-session-secret-long-enough'
  process.env.LLM_API_KEY = ''
  process.env.LLM_MODEL = 'fallback'
  process.env.EMBEDDING_MODEL = 'text-embedding-3-small'
  vi.resetModules()

  const { createApp } = await import('./index')
  const dbModule = await import('./db')
  const storageModule = await import('./storage')
  const app = createApp()
  const server = app.listen(0)
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Failed to start test server')
  const baseUrl = `http://127.0.0.1:${address.port}`
  let cookie = ''

  const request = async (path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers)
    if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json')
    if (cookie && !headers.has('Cookie')) headers.set('Cookie', cookie)
    const response = await fetch(`${baseUrl}${path}`, { ...init, headers })
    const setCookie = response.headers.get('set-cookie')
    if (setCookie) cookie = setCookie.split(';')[0]
    return response
  }

  return {
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
    createFileMetadata: dbModule.createFileMetadata,
    dir,
    getSetting: dbModule.getSetting,
    listAiCompletions: dbModule.listAiCompletions,
    listFiles: dbModule.listFiles,
    listIdeaEvents: dbModule.listIdeaEvents,
    listIdeas: dbModule.listIdeas,
    listStoredFileKeys: storageModule.listStoredFileKeys,
    login: () => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ password: 'ui-password' }) }),
    recordAiCompletion: dbModule.recordAiCompletion,
    recordIdeaEvent: dbModule.recordIdeaEvent,
    request,
  }
}

const createBackupManifest = async () => {
  const harness = await createHarness('source')
  try {
    expect((await harness.login()).status).toBe(200)

    const createIdeaResponse = await harness.request('/api/ideas', {
      method: 'POST',
      body: JSON.stringify({
        id: 'idea-restore-seed',
        title: 'Restore seed',
        summary: 'A local-first backup should restore durable workbench data.',
        status: 'PIPELINE',
        source: 'local',
        tags: ['backup', 'restore'],
        whyNow: 'Operators need a trustworthy import contract.',
        mvpScope: 'Restore ideas, events, completion audit, and safe settings.',
        firstAction: 'Ship the import endpoint behind the session-authenticated settings plane.',
        scratchpad: 'Export first, then restore into a clean environment.',
        aiEnriched: true,
        aiAnalysis: {
          mvpSuggestion: 'Keep restore scoped to one local workbench.',
          risks: ['Secrets could leak into exports', 'Replace import could leave orphaned files'],
          firstActions: ['Mask secrets', 'Reject live overwrite without replace'],
          boundaryNotes: 'File bytes stay on disk; the backup only carries metadata.',
        },
        sortOrder: 7,
        createdAt: '2026-05-30T00:00:00.000Z',
        updatedAt: '2026-05-30T00:00:00.000Z',
      }),
    })
    expect(createIdeaResponse.status).toBe(201)

    harness.recordIdeaEvent({
      ideaId: 'idea-restore-seed',
      type: 'idea_updated',
      actor: 'agent',
      payload: { endpoint: '/api/agent/v1/ideas/idea-restore-seed', changedFields: ['summary'] },
      id: 'event-restore-seed',
      createdAt: '2026-05-30T00:01:00.000Z',
    })

    harness.recordAiCompletion({
      ideaId: 'idea-restore-seed',
      provider: 'local',
      model: 'fallback',
      promptHash: 'prompt-restore-seed',
      ideaVersion: 2,
      input: { ideaId: 'idea-restore-seed', notes: 'restore-contract' },
      output: { mvpSuggestion: 'Restore the workbench into a clean local environment.' },
      status: 'succeeded',
      id: 'completion-restore-seed',
      createdAt: '2026-05-30T00:02:00.000Z',
    })

    harness.createFileMetadata({
      ideaId: 'idea-restore-seed',
      kind: 'markdown',
      filename: 'restore-notes.md',
      mimeType: 'text/markdown',
      sizeBytes: 42,
      storageKey: 'idea-restore-seed/restore-notes.md',
      sha256: 'sha-restore-notes',
      id: 'file-restore-seed',
      createdAt: '2026-05-30T00:03:00.000Z',
    })

    const updateSettingsResponse = await harness.request('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({
        workspaceName: 'Restored Workbench',
        llmModel: 'qwen/qwen3-coder',
        embeddingModel: 'nomic-embed-text',
        storagePath: join(harness.dir, 'custom-files'),
        agentExposure: 'private-vps',
        llmApiKey: 'sk-source...9999',
      }),
    })
    expect(updateSettingsResponse.status).toBe(200)

    const backupResponse = await harness.request('/api/settings/backup', { method: 'POST' })
    expect(backupResponse.status).toBe(201)
    const backup = (await backupResponse.json()) as { manifest: BackupManifest }
    return backup.manifest
  } finally {
    await harness.close()
  }
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('export and restore contract', () => {
  it('exports a secret-safe manifest and restores durable records into a fresh local environment', async () => {
    const manifest = await createBackupManifest()

    expect(manifest).toMatchObject({
      schemaVersion: 1,
      product: 'Personal Idea Workbench',
      settings: {
        workspaceName: 'Restored Workbench',
        llmModel: 'qwen/qwen3-coder',
        embeddingModel: 'nomic-embed-text',
        llmApiKeyConfigured: true,
        llmApiKeyMasked: '••••9999',
      },
      boundaries: {
        singleUser: true,
        includesRawSecrets: false,
        includesStoredFileContents: false,
        restoreRequiresExplicitReplace: true,
        restoresSettingsKeys: ['workspaceName', 'llmModel', 'embeddingModel', 'agentExposure'],
        skipsSettingsKeys: ['schemaVersion', 'storagePath', 'agentBasePath', 'llmApiKeyConfigured', 'llmApiKeyMasked'],
      },
    })
    expect(manifest.exportedAt).toEqual(expect.any(String))
    expect(manifest.ideas).toHaveLength(1)
    expect(manifest.ideaEvents).toEqual([expect.objectContaining({ id: 'event-restore-seed', ideaId: 'idea-restore-seed', actor: 'agent' })])
    expect(manifest.aiCompletions).toEqual([expect.objectContaining({ id: 'completion-restore-seed', ideaId: 'idea-restore-seed', model: 'fallback' })])
    expect(manifest.files).toEqual([expect.objectContaining({ id: 'file-restore-seed', filename: 'restore-notes.md', storageKey: 'idea-restore-seed/restore-notes.md' })])
    expect(JSON.stringify(manifest)).not.toContain('sk-source...9999')

    const destination = await createHarness('destination-fresh')
    try {
      expect((await destination.login()).status).toBe(200)

      const importResponse = await destination.request('/api/settings/import', {
        method: 'POST',
        body: JSON.stringify({ manifest }),
      })

      expect(importResponse.status).toBe(201)
      const payload = (await importResponse.json()) as {
        restored: Record<string, number>
        skipped: { files: number; settings: string[] }
      }
      expect(payload).toEqual({
        restored: { ideas: 1, ideaEvents: 1, aiCompletions: 1, settings: 4 },
        skipped: {
          files: 1,
          settings: ['schemaVersion', 'storagePath', 'agentBasePath', 'llmApiKeyConfigured', 'llmApiKeyMasked'],
        },
      })
      expect(JSON.stringify(payload)).not.toContain('sk-source...9999')

      expect(destination.listIdeas()).toEqual([
        expect.objectContaining({
          id: 'idea-restore-seed',
          title: 'Restore seed',
          status: 'PIPELINE',
          source: 'local',
          tags: ['backup', 'restore'],
        }),
      ])
      expect(destination.listIdeaEvents('idea-restore-seed')).toEqual([
        expect.objectContaining({ id: 'event-restore-seed', actor: 'agent', type: 'idea_updated' }),
      ])
      expect(destination.listAiCompletions('idea-restore-seed')).toEqual([
        expect.objectContaining({ id: 'completion-restore-seed', provider: 'local', model: 'fallback', status: 'succeeded' }),
      ])
      expect(destination.listFiles()).toEqual([])
      expect(destination.getSetting('llmApiKey')).toBeNull()

      const settingsResponse = await destination.request('/api/settings')
      expect(settingsResponse.status).toBe(200)
      const settingsPayload = (await settingsResponse.json()) as { settings: Record<string, unknown> }
      expect(settingsPayload.settings).toMatchObject({
        workspaceName: 'Restored Workbench',
        llmModel: 'qwen/qwen3-coder',
        embeddingModel: 'nomic-embed-text',
        agentExposure: 'private-vps',
        llmApiKeyConfigured: false,
        llmApiKeyMasked: '',
      })
      expect(settingsPayload.settings.storagePath).toContain(destination.dir)
      expect(settingsPayload.settings.storagePath).not.toContain('custom-files')
    } finally {
      await destination.close()
    }
  })

  it('rejects incompatible schemas and requires explicit replace before overwriting live local data', async () => {
    const manifest = await createBackupManifest()

    const incompatibleTarget = await createHarness('destination-incompatible')
    try {
      expect((await incompatibleTarget.login()).status).toBe(200)

      const response = await incompatibleTarget.request('/api/settings/import', {
        method: 'POST',
        body: JSON.stringify({ manifest: { ...manifest, schemaVersion: 99 } }),
      })

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'Unsupported backup schemaVersion: 99' })
    } finally {
      await incompatibleTarget.close()
    }

    const liveTarget = await createHarness('destination-live')
    try {
      expect((await liveTarget.login()).status).toBe(200)
      expect(
        (
          await liveTarget.request('/api/ideas', {
            method: 'POST',
            body: JSON.stringify({ title: 'Live local idea', summary: 'Should block overwrite without replace.', tags: ['live'], whyNow: 'Protect live local data.' }),
          })
        ).status,
      ).toBe(201)
      expect((await liveTarget.request('/api/settings/backup', { method: 'POST' })).status).toBe(201)
      expect(liveTarget.listStoredFileKeys().length).toBeGreaterThan(0)

      const conflictResponse = await liveTarget.request('/api/settings/import', {
        method: 'POST',
        body: JSON.stringify({ manifest }),
      })
      expect(conflictResponse.status).toBe(409)
      expect(await conflictResponse.json()).toEqual({ error: 'Import would overwrite existing local data. Re-run with mode: "replace".' })

      const replaceResponse = await liveTarget.request('/api/settings/import', {
        method: 'POST',
        body: JSON.stringify({ manifest, mode: 'replace' }),
      })
      expect(replaceResponse.status).toBe(201)
      expect(liveTarget.listIdeas()).toEqual([expect.objectContaining({ id: 'idea-restore-seed' })])
      expect(liveTarget.listStoredFileKeys()).toEqual([])
    } finally {
      await liveTarget.close()
    }
  })
})