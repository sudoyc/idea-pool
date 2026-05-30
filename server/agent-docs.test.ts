import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(path, 'utf8')

describe('agent API documentation', () => {
  it('documents versioned auth, settings, idea, event, completion, and file content endpoints', () => {
    const docs = read('docs/agent-api.md')

    for (const phrase of [
      'Personal Idea Workbench Agent API',
      'Authorization: Bearer',
      'Local-first Kanban + Spatial Detail View + AI Augmentation',
      'GET /api/agent/v1/context',
      'GET /api/agent/v1/schema',
      'GET /api/agent/v1/settings',
      'GET /api/agent/v1/ideas',
      'POST /api/agent/v1/ideas',
      'PATCH /api/agent/v1/ideas/:id',
      'POST /api/agent/v1/ideas/:id/events',
      'POST /api/agent/v1/ideas/:id/complete',
      'POST /api/agent/v1/ideas/:id/agent-pack',
      'POST /api/agent/v1/ideas/:id/files/content',
      'GET /api/agent/v1/files/:id/download',
      'DELETE /api/agent/v1/files/:id',
      'curl',
    ]) {
      expect(docs).toContain(phrase)
    }
  })
})
