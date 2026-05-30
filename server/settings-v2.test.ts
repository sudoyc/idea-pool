import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const tempDirs: string[] = []

const createHarness = async () => {
  const dir = mkdtempSync(join(tmpdir(), 'idea-workbench-settings-v2-'))
  tempDirs.push(dir)
  process.env.DATABASE_URL = `file:${join(dir, 'settings-v2.db')}`
  process.env.IDEA_POOL_DATA_DIR = dir
  process.env.IDEA_POOL_AUTH_ENABLED = 'true'
  process.env.IDEA_POOL_TOKEN = 'agent-token'
  process.env.IDEA_POOL_PASSWORD = 'ui-password'
  process.env.IDEA_POOL_SESSION_SECRET = 'test-session-secret-long-enough'
  process.env.LLM_API_KEY = 'sk-env-secret-123456'
  process.env.LLM_MODEL = 'gpt-4o-mini'
  process.env.EMBEDDING_MODEL = 'text-embedding-3-small'
  vi.resetModules()
  const { createApp } = await import('./index')
  const { getSetting, listFiles } = await import('./db')
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

  const login = () => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ password: 'ui-password' }) })
  const agentRequest = (path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers)
    headers.set('Authorization', 'Bearer agent-token')
    return request(path, { ...init, headers })
  }

  return { agentRequest, close: () => new Promise<void>((resolve) => server.close(() => resolve())), dir, getSetting, listFiles, login, request }
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('Settings v2 control plane', () => {
  it('returns a sanitized schema-versioned settings payload without leaking raw API keys', async () => {
    const harness = await createHarness()
    try {
      expect((await harness.login()).status).toBe(200)

      const response = await harness.request('/api/settings')
      expect(response.status).toBe(200)
      const payload = (await response.json()) as { settings: Record<string, unknown> }

      expect(payload.settings).toMatchObject({
        schemaVersion: 2,
        workspaceName: 'Personal Idea Workbench',
        llmModel: 'gpt-4o-mini',
        embeddingModel: 'text-embedding-3-small',
        agentBasePath: '/api/agent/v1',
        agentExposure: 'private',
        llmApiKeyConfigured: true,
        llmApiKeyMasked: '••••3456',
      })
      expect(payload.settings.storagePath).toContain(harness.dir)
      expect(payload.settings).not.toHaveProperty('llmApiKey')
      expect(JSON.stringify(payload)).not.toContain('sk-env-secret-123456')
    } finally {
      await harness.close()
    }
  })

  it('lets the UI update editable settings and store an API key write-only', async () => {
    const harness = await createHarness()
    try {
      expect((await harness.login()).status).toBe(200)

      const updateResponse = await harness.request('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({
          workspaceName: 'Private Workbench',
          llmModel: 'qwen/qwen3-coder',
          embeddingModel: 'nomic-embed-text',
          agentExposure: 'private-vps',
          storagePath: join(harness.dir, 'custom-files'),
          llmApiKey: 'sk-user-secret-999999',
        }),
      })

      expect(updateResponse.status).toBe(200)
      const payload = (await updateResponse.json()) as { settings: Record<string, unknown> }
      expect(payload.settings).toMatchObject({
        workspaceName: 'Private Workbench',
        llmModel: 'qwen/qwen3-coder',
        embeddingModel: 'nomic-embed-text',
        agentExposure: 'private-vps',
        llmApiKeyConfigured: true,
        llmApiKeyMasked: '••••9999',
      })
      expect(payload.settings).not.toHaveProperty('llmApiKey')
      expect(JSON.stringify(payload)).not.toContain('sk-user-secret-999999')
      expect(harness.getSetting('llmApiKey')).toBe('sk-user-secret-999999')
    } finally {
      await harness.close()
    }
  })

  it('creates a sanitized backup export file from the settings control plane', async () => {
    const harness = await createHarness()
    try {
      expect((await harness.login()).status).toBe(200)
      const createIdeaResponse = await harness.agentRequest('/api/agent/v1/ideas', {
        method: 'POST',
        body: JSON.stringify({ title: 'Backup seed', summary: 'Exportable idea', tags: ['backup'], whyNow: 'Backups must be operator-safe.' }),
      })
      expect(createIdeaResponse.status).toBe(201)

      const backupResponse = await harness.request('/api/settings/backup', { method: 'POST' })
      expect(backupResponse.status).toBe(201)
      const backup = (await backupResponse.json()) as { file: { id: string; kind: string; filename: string; storageKey: string }; manifest: Record<string, unknown> }
      expect(backup.file.kind).toBe('export')
      expect(backup.file.filename).toMatch(/^personal-idea-workbench-backup-.*\.json$/)
      expect(backup.manifest).toMatchObject({ schemaVersion: 1, product: 'Personal Idea Workbench' })
      expect(JSON.stringify(backup)).not.toContain('sk-env-secret-123456')
      expect(harness.listFiles()).toEqual([expect.objectContaining({ id: backup.file.id, kind: 'export' })])

      const download = await harness.request(`/api/files/${backup.file.id}/download`)
      expect(download.status).toBe(200)
      const exported = await download.json() as Record<string, unknown>
      expect(exported).toMatchObject({ schemaVersion: 1, product: 'Personal Idea Workbench' })
      expect(JSON.stringify(exported)).not.toContain('sk-env-secret-123456')
    } finally {
      await harness.close()
    }
  })
})
