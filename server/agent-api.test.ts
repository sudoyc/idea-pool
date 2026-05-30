import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const tempDirs: string[] = []

const createHarness = async () => {
  const dir = mkdtempSync(join(tmpdir(), 'idea-workbench-agent-'))
  tempDirs.push(dir)
  process.env.DATABASE_URL = `file:${join(dir, 'agent.db')}`
  process.env.IDEA_POOL_DATA_DIR = dir
  process.env.IDEA_POOL_AUTH_ENABLED = 'true'
  process.env.IDEA_POOL_TOKEN = 'agent-token'
  process.env.IDEA_POOL_PASSWORD = 'ui-password'
  process.env.IDEA_POOL_SESSION_SECRET = 'test-session-secret'
  delete process.env.LLM_API_KEY
  vi.resetModules()
  const { createApp } = await import('./index')
  const { listAiCompletions, listFiles } = await import('./db')
  const app = createApp()
  const server = app.listen(0)
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Failed to start test server')
  const baseUrl = `http://127.0.0.1:${address.port}`
  const request = async (path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers)
    if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json')
    return fetch(`${baseUrl}${path}`, { ...init, headers })
  }
  const agentRequest = (path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers)
    headers.set('Authorization', 'Bearer agent-token')
    return request(path, { ...init, headers })
  }
  return { agentRequest, close: () => new Promise<void>((resolve) => server.close(() => resolve())), dir, listAiCompletions, listFiles, request }
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('agent API v1', () => {
  it('requires bearer auth and exposes context plus schema', async () => {
    const harness = await createHarness()
    try {
      const unauthorized = await harness.request('/api/agent/v1/context')
      expect(unauthorized.status).toBe(401)

      const contextResponse = await harness.agentRequest('/api/agent/v1/context')
      expect(contextResponse.status).toBe(200)
      const context = (await contextResponse.json()) as { workspace: { name: string }; api: { version: string }; rules: { localFirst: boolean } }
      expect(context.workspace.name).toBe('Personal Idea Workbench')
      expect(context.api.version).toBe('v1')
      expect(context.rules.localFirst).toBe(true)

      const schemaResponse = await harness.agentRequest('/api/agent/v1/schema')
      expect(schemaResponse.status).toBe(200)
      const schema = (await schemaResponse.json()) as { ideaStatuses: string[]; fileKinds: string[] }
      expect(schema.ideaStatuses).toEqual(['INBOX', 'PIPELINE', 'TRASH'])
      expect(schema.fileKinds).toContain('agent_pack')
    } finally {
      await harness.close()
    }
  })

  it('lets an agent create an idea, record events, complete it, and persist an agent pack file', async () => {
    const harness = await createHarness()
    try {
      const createResponse = await harness.agentRequest('/api/agent/v1/ideas', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Agent supplied idea',
          summary: 'A remote agent can capture a new seed without using the UI.',
          tags: ['agent'],
          whyNow: 'The product needs a stable remote ingress.',
        }),
      })
      expect(createResponse.status).toBe(201)
      const created = (await createResponse.json()) as { idea: { id: string; source: string; status: string } }
      expect(created.idea.source).toBe('agent')
      expect(created.idea.status).toBe('INBOX')

      const eventResponse = await harness.agentRequest(`/api/agent/v1/ideas/${created.idea.id}/events`, {
        method: 'POST',
        body: JSON.stringify({ type: 'agent_read', payload: { reason: 'prepare-pack' } }),
      })
      expect(eventResponse.status).toBe(201)
      const eventPayload = (await eventResponse.json()) as { event: { type: string; actor: string; payload: { reason: string } } }
      expect(eventPayload.event).toMatchObject({ type: 'agent_read', actor: 'agent', payload: { reason: 'prepare-pack' } })

      const completeResponse = await harness.agentRequest(`/api/agent/v1/ideas/${created.idea.id}/complete`, { method: 'POST' })
      expect(completeResponse.status).toBe(200)
      const completed = (await completeResponse.json()) as { idea: { aiEnriched: boolean; status: string }; aiAnalysis: { firstActions: string[] } }
      expect(completed.idea.aiEnriched).toBe(true)
      expect(completed.idea.status).toBe('PIPELINE')
      expect(completed.aiAnalysis.firstActions.length).toBeGreaterThan(0)
      expect(harness.listAiCompletions(created.idea.id)).toHaveLength(1)

      const packResponse = await harness.agentRequest(`/api/agent/v1/ideas/${created.idea.id}/agent-pack`, { method: 'POST' })
      expect(packResponse.status).toBe(201)
      const pack = (await packResponse.json()) as { file: { filename: string; storageKey: string; kind: string } }
      expect(pack.file).toMatchObject({ filename: 'agent-supplied-idea-agent-pack.md', kind: 'agent_pack' })
      expect(harness.listFiles(created.idea.id)).toHaveLength(1)
      const storedPack = readFileSync(join(harness.dir, 'files', pack.file.storageKey), 'utf8')
      expect(storedPack).toContain('Agent supplied idea')
      expect(storedPack).toContain('Local-first Kanban + Spatial Detail View + AI Augmentation')
    } finally {
      await harness.close()
    }
  })
})
