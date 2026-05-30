import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const tempDirs: string[] = []

const createHarness = async () => {
  const dir = mkdtempSync(join(tmpdir(), 'idea-workbench-api-v1-'))
  tempDirs.push(dir)
  process.env.DATABASE_URL = `file:${join(dir, 'workbench.db')}`
  process.env.IDEA_POOL_DATA_DIR = dir
  process.env.IDEA_POOL_AUTH_ENABLED = 'true'
  process.env.IDEA_POOL_TOKEN = 'agent-token'
  process.env.IDEA_POOL_PASSWORD = 'ui-password'
  process.env.IDEA_POOL_SESSION_SECRET = 'test-session-secret-long-enough'
  delete process.env.LLM_API_KEY
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

  const agentRequest = (path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers)
    headers.set('Authorization', 'Bearer agent-token')
    return request(path, { ...init, headers })
  }

  const login = () => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ password: 'ui-password' }) })

  return { agentRequest, close: () => new Promise<void>((resolve) => server.close(() => resolve())), dir, getSetting, listFiles, login, request }
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('hardened product API v1', () => {
  it('persists editable settings for the UI and exposes a read-only settings summary to agents', async () => {
    const harness = await createHarness()
    try {
      expect((await harness.request('/api/settings')).status).toBe(401)
      expect((await harness.login()).status).toBe(200)

      const defaultsResponse = await harness.request('/api/settings')
      expect(defaultsResponse.status).toBe(200)
      const defaults = (await defaultsResponse.json()) as { settings: Record<string, unknown> }
      expect(defaults.settings).toMatchObject({
        workspaceName: 'Personal Idea Workbench',
        agentBasePath: '/api/agent/v1',
        agentExposure: 'private',
      })

      const updateResponse = await harness.request('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({
          workspaceName: 'Private Idea Workbench',
          llmModel: 'local-fallback',
          agentExposure: 'private-vps',
        }),
      })
      expect(updateResponse.status).toBe(200)
      expect(harness.getSetting('workspaceName')).toBe('Private Idea Workbench')

      const agentSettingsResponse = await harness.agentRequest('/api/agent/v1/settings')
      expect(agentSettingsResponse.status).toBe(200)
      const agentSettings = (await agentSettingsResponse.json()) as { settings: Record<string, unknown>; writable: boolean }
      expect(agentSettings.writable).toBe(false)
      expect(agentSettings.settings).toMatchObject({ workspaceName: 'Private Idea Workbench', agentExposure: 'private-vps' })
    } finally {
      await harness.close()
    }
  })

  it('uploads, downloads, lists, and deletes file content without allowing unsafe filenames', async () => {
    const harness = await createHarness()
    try {
      await harness.login()
      const createResponse = await harness.agentRequest('/api/agent/v1/ideas', {
        method: 'POST',
        body: JSON.stringify({ title: 'File backed idea', summary: 'Needs durable files.', tags: ['files'], whyNow: 'Handoff needs artifacts.' }),
      })
      const created = (await createResponse.json()) as { idea: { id: string } }

      const unsafeResponse = await harness.agentRequest(`/api/agent/v1/ideas/${created.idea.id}/files/content`, {
        method: 'POST',
        body: JSON.stringify({ filename: '../evil.md', kind: 'markdown', content: 'bad' }),
      })
      expect(unsafeResponse.status).toBe(400)

      const uploadResponse = await harness.agentRequest(`/api/agent/v1/ideas/${created.idea.id}/files/content`, {
        method: 'POST',
        body: JSON.stringify({ filename: 'brief.md', kind: 'markdown', mimeType: 'text/markdown', content: '# Brief\nAgent handoff notes.' }),
      })
      expect(uploadResponse.status).toBe(201)
      const uploaded = (await uploadResponse.json()) as { file: { id: string; filename: string; sha256: string; sizeBytes: number } }
      expect(uploaded.file.filename).toBe('brief.md')
      expect(uploaded.file.sha256).toMatch(/^[a-f0-9]{64}$/)
      expect(uploaded.file.sizeBytes).toBeGreaterThan(10)
      expect(harness.listFiles(created.idea.id)).toHaveLength(1)

      const sessionListResponse = await harness.request(`/api/ideas/${created.idea.id}/files`)
      expect(sessionListResponse.status).toBe(200)
      const sessionList = (await sessionListResponse.json()) as { files: Array<{ id: string; filename: string }> }
      expect(sessionList.files).toEqual([expect.objectContaining({ id: uploaded.file.id, filename: 'brief.md' })])

      const downloadResponse = await harness.request(`/api/files/${uploaded.file.id}/download`)
      expect(downloadResponse.status).toBe(200)
      expect(downloadResponse.headers.get('content-type')).toContain('text/markdown')
      expect(await downloadResponse.text()).toContain('Agent handoff notes')

      const storedFiles = harness.listFiles(created.idea.id)
      const storedContent = readFileSync(join(harness.dir, 'files', storedFiles[0].storageKey), 'utf8')
      expect(storedContent).toContain('# Brief')

      const deleteResponse = await harness.agentRequest(`/api/agent/v1/files/${uploaded.file.id}`, { method: 'DELETE' })
      expect(deleteResponse.status).toBe(200)
      expect(await deleteResponse.json()).toMatchObject({ ok: true })
      expect(harness.listFiles(created.idea.id)).toHaveLength(0)
      expect((await harness.request(`/api/files/${uploaded.file.id}/download`)).status).toBe(404)
    } finally {
      await harness.close()
    }
  })
})
