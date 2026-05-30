import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('test runner configuration', () => {
  it('does not rediscover compiled test files from dist-server', () => {
    const config = readFileSync('vite.config.ts', 'utf8')

    expect(config).toContain('test:')
    expect(config).toContain('exclude')
    expect(config).toContain('dist-server')
  })
})
