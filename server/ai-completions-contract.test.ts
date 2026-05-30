import { createServer, type Server } from 'node:http'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const tempDirs: string[] = []
const servers: Server[] = []

const closeServer = (server: Server) => new Promise<void>((resolve) => server.close(() => resolve()))

const startFailingLlmServer = async () => {
  const server = createServer((_request, response) => {
    response.writeHead(500, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ error: 'remote model unavailable' }))
  })
  servers.push(server)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('LLM server did not start')
  return `http://127.0.0.1:${address.port}`
}

const createHarness = async () => {
  const dir = mkdtempSync(join(tmpdir(), 'idea-workbench-ai-completion-'))
  tempDirs.push(dir)
  process.env.DATABASE_URL = `file:${join(dir, 'ai.db')}`
  process.env.IDEA_POOL_DATA_DIR = dir
  process.env.IDEA_POOL_AUTH_ENABLED = 'false'
  process.env.LLM_API_KEY = 'sk-test-failure'
  process.env.LLM_MODEL = 'gpt-test-failure'
  process.env.LLM_BASE_URL = await startFailingLlmServer()
  vi.resetModules()
  const dbModule = await import('./db')
  const { createApp } = await import('./index')
  const app = createApp()
  const server = app.listen(0)
  servers.push(server)
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('App server did not start')
  const baseUrl = `http://127.0.0.1:${address.port}`
  return { ...dbModule, request: (path: string, init: RequestInit = {}) => fetch(`${baseUrl}${path}`, { headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) }, ...init }) }
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => closeServer(server)))
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('AI completion audit records', () => {
  it('records prompt/model/result/idea version and a failure event without corrupting the idea', async () => {
    const harness = await createHarness()

    const createResponse = await harness.request('/api/ideas', {
      method: 'POST',
      body: JSON.stringify({ id: 'ai-failure-idea', title: 'Remote failure idea', summary: 'Needs a failed audit trail.', whyNow: 'Failures must be explainable.' }),
    })
    expect(createResponse.status).toBe(201)

    const completeResponse = await harness.request('/api/ideas/ai-failure-idea/complete', { method: 'POST', body: JSON.stringify({ notes: 'force remote failure' }) })
    expect(completeResponse.status).toBe(502)

    const idea = harness.getIdea('ai-failure-idea')
    expect(idea).toMatchObject({ id: 'ai-failure-idea', aiEnriched: false, status: 'INBOX' })

    expect(harness.listAiCompletions('ai-failure-idea')[0]).toMatchObject({
      ideaId: 'ai-failure-idea',
      provider: 'remote',
      model: 'gpt-test-failure',
      promptHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      ideaVersion: expect.any(Number),
      status: 'failed',
      error: expect.stringContaining('remote model unavailable'),
      input: expect.objectContaining({ ideaId: 'ai-failure-idea', notes: 'force remote failure' }),
    })

    expect(harness.listIdeaEvents('ai-failure-idea')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'ai_completion_requested', actor: 'llm' }),
        expect.objectContaining({ type: 'ai_completion_failed', actor: 'llm', payload: expect.objectContaining({ model: 'gpt-test-failure' }) }),
      ]),
    )
  })
})
