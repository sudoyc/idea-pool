import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(path, 'utf8')

describe('operator documentation', () => {
  it('describes the product model, local development, quality gate, and production compose workflow', () => {
    const readme = read('README.md')

    for (const phrase of [
      'Personal Idea Workbench',
      'Local-first Kanban + Spatial Detail View + AI Augmentation',
      'npm test',
      'npm run lint',
      'npm run build',
      'npm run build:server',
      'docker compose -f docker-compose.dev.yml up --build',
      'docker compose up --build -d',
    ]) {
      expect(readme).toContain(phrase)
    }
  })

  it('documents session auth and versioned agent API endpoints', () => {
    const readme = read('README.md')

    for (const phrase of [
      'IDEA_POOL_AUTH_ENABLED',
      'IDEA_POOL_PASSWORD',
      'IDEA_POOL_TOKEN',
      'IDEA_POOL_SESSION_SECRET',
      '/api/auth/login',
      '/api/auth/logout',
      '/api/auth/session',
      '/api/agent/v1/context',
      '/api/agent/v1/schema',
      '/api/agent/v1/ideas',
      '/api/agent/v1/ideas/:id/events',
      '/api/agent/v1/ideas/:id/complete',
      '/api/agent/v1/ideas/:id/agent-pack',
      '/api/agent/v1/ideas/:id/files',
    ]) {
      expect(readme).toContain(phrase)
    }
  })
})
