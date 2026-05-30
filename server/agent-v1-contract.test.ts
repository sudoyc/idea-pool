import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const tempDirs: string[] = []

const createHarness = async () => {
  const dir = mkdtempSync(join(tmpdir(), 'idea-workbench-agent-contract-'))
  tempDirs.push(dir)
  process.env.DATABASE_URL = `file:${join(dir, 'agent-contract.db')}`
  process.env.IDEA_POOL_DATA_DIR = dir
  process.env.IDEA_POOL_AUTH_ENABLED = 'true'
  process.env.IDEA_POOL_TOKEN = 'agent-token'
  process.env.IDEA_POOL_PASSWORD = 'ui-password'
  process.env.IDEA_POOL_SESSION_SECRET = 'test-session-secret-long-enough'
  process.env.LLM_API_KEY = 'sk-agent-secret-1234'
  vi.resetModules()
  const { createApp } = await import('./index')
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

  return {
    agentRequest,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
    login: () => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ password: 'ui-password' }) }),
    request,
  }
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

type AgentRouteContract = { method: string; path: string; auth?: string; scope?: string; writable?: boolean }
type AgentContextContract = {
  protocol?: Record<string, unknown>
  workspace?: Record<string, unknown>
  api?: Record<string, unknown>
  auth?: Record<string, unknown>
  rules?: Record<string, unknown>
  ai?: Record<string, unknown>
  routes?: AgentRouteContract[]
}

describe('Agent API v1 hardened contract', () => {
  it('exposes a versioned context contract with explicit auth, route, and AI boundaries', async () => {
    const harness = await createHarness()
    try {
      const response = await harness.agentRequest('/api/agent/v1/context')
      expect(response.status).toBe(200)
      const context = (await response.json()) as AgentContextContract

      expect(context).toMatchObject({
        protocol: { name: 'personal-idea-workbench-agent', version: 1 },
        workspace: { name: 'Personal Idea Workbench', model: 'Local-first Kanban + Spatial Detail View + AI Augmentation' },
        api: { version: 'v1', basePath: '/api/agent/v1', settingsSchemaVersion: 2 },
        auth: { agent: 'bearer', web: 'session-cookie', settingsWritable: false },
        rules: { localFirst: true, singleUser: true, selectedIdeaOnlyAi: true, aiMaySelectIdea: false },
        ai: { completionScope: 'selected-idea', requiresIdeaId: true, autoSelectIdea: false },
      })
      expect(context.routes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ method: 'GET', path: '/context', auth: 'bearer' }),
          expect.objectContaining({ method: 'POST', path: '/ideas/:id/complete', scope: 'selected-idea-ai' }),
          expect.objectContaining({ method: 'GET', path: '/settings', writable: false }),
        ]),
      )
    } finally {
      await harness.close()
    }
  })

  it('keeps session settings and agent settings on separate auth boundaries', async () => {
    const harness = await createHarness()
    try {
      const bearerSettings = await harness.request('/api/settings', { headers: { Authorization: 'Bearer agent-token' } })
      expect(bearerSettings.status).toBe(401)

      const agentSettingsResponse = await harness.agentRequest('/api/agent/v1/settings')
      expect(agentSettingsResponse.status).toBe(200)
      const agentSettings = (await agentSettingsResponse.json()) as { settings: Record<string, unknown>; writable: boolean }
      expect(agentSettings.writable).toBe(false)
      expect(agentSettings.settings).not.toHaveProperty('llmApiKey')
      expect(JSON.stringify(agentSettings)).not.toContain('sk-agent-secret-1234')

      expect((await harness.login()).status).toBe(200)
      expect((await harness.request('/api/settings')).status).toBe(200)
    } finally {
      await harness.close()
    }
  })

  it('does not provide a collection-level AI completion endpoint that could auto-select ideas', async () => {
    const harness = await createHarness()
    try {
      const response = await harness.agentRequest('/api/agent/v1/complete', { method: 'POST', body: JSON.stringify({ prompt: 'pick something' }) })
      expect(response.status).toBe(404)
    } finally {
      await harness.close()
    }
  })
})
