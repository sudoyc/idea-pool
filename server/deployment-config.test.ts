import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(path, 'utf8')

describe('deployment configuration', () => {
  it('documents all auth, database, file storage, and LLM environment variables', () => {
    const envExample = read('.env.example')

    for (const key of [
      'IDEA_POOL_AUTH_ENABLED',
      'IDEA_POOL_PASSWORD',
      'IDEA_POOL_TOKEN',
      'IDEA_POOL_SESSION_SECRET',
      'IDEA_POOL_DATA_DIR',
      'DATABASE_URL',
      'LLM_API_KEY',
      'LLM_BASE_URL',
      'LLM_MODEL',
    ]) {
      expect(envExample).toContain(`${key}=`)
    }
  })

  it('does not ship production compose with a default agent token', () => {
    const compose = read('docker-compose.yml')

    expect(compose).not.toContain('change-me')
    expect(compose).toContain('IDEA_POOL_TOKEN: ${IDEA_POOL_TOKEN:?')
    expect(compose).toContain('IDEA_POOL_PASSWORD: ${IDEA_POOL_PASSWORD:?')
    expect(compose).toContain('IDEA_POOL_SESSION_SECRET: ${IDEA_POOL_SESSION_SECRET:?')
    expect(compose).toContain('IDEA_POOL_DATA_DIR: /data')
  })

  it('keeps dev compose hot reload usable with auth disabled by default and files persisted', () => {
    const compose = read('docker-compose.dev.yml')

    expect(compose).toContain('IDEA_POOL_AUTH_ENABLED: ${IDEA_POOL_AUTH_ENABLED:-false}')
    expect(compose).toContain('IDEA_POOL_DATA_DIR: /data')
    expect(compose).toContain('CHOKIDAR_USEPOLLING: "true"')
    expect(compose).toContain('./data:/data')
  })
})
