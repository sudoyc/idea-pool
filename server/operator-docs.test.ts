import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(path, 'utf8')

describe('operator documentation', () => {
  it('documents local dev, production commands, env vars, data layout, backup/import boundaries, and disaster recovery', () => {
    const guide = read('docs/operator-guide.md')

    for (const phrase of [
      'Personal Idea Workbench',
      'Local-first Kanban + Spatial Detail View + AI Augmentation',
      'npm install',
      'npm run dev',
      'docker compose -f docker-compose.dev.yml up --build',
      'docker compose up --build -d',
      'IDEA_POOL_AUTH_ENABLED',
      'IDEA_POOL_PASSWORD',
      'IDEA_POOL_TOKEN',
      'IDEA_POOL_SESSION_SECRET',
      'IDEA_POOL_DATA_DIR',
      'DATABASE_URL',
      '/api/health',
      '/api/settings/backup',
      '/api/settings/import',
      'mode: "replace"',
      'single-user',
      'raw secrets are never exported',
      'file metadata only',
      'IDEA_POOL_DATA_DIR/files',
      'reverse proxy',
      'disaster recovery',
    ]) {
      expect(guide).toContain(phrase)
    }
  })

  it('documents the agent boundary relative to the session-authenticated backup/import control plane', () => {
    const docs = read('docs/agent-api.md')

    for (const phrase of [
      'single-user/private deployment',
      'writable: false',
      'The backup/import flow stays on the session-authenticated settings control plane.',
      '/api/agent/v1/context',
      '/api/agent/v1/schema',
      '/api/agent/v1/settings',
      '/api/agent/v1/ideas',
      '/api/agent/v1/ideas/:id/complete',
    ]) {
      expect(docs).toContain(phrase)
    }
  })
})
