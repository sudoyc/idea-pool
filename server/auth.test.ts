import { describe, expect, it } from 'vitest'
import { assertAuthConfiguration, getAuthMode, getSessionState } from './auth'

const request = (headers: Record<string, string> = {}) =>
  ({
    header: (name: string) => headers[name.toLowerCase()],
  })

describe('auth helpers', () => {
  it('returns disabled mode when auth is turned off', () => {
    process.env.IDEA_POOL_AUTH_ENABLED = 'false'
    delete process.env.IDEA_POOL_PASSWORD
    delete process.env.IDEA_POOL_TOKEN

    expect(getAuthMode()).toBe('disabled')
    expect(getSessionState(request() as never).authenticated).toBe(true)
  })

  it('detects password auth mode', () => {
    process.env.IDEA_POOL_AUTH_ENABLED = 'true'
    process.env.IDEA_POOL_PASSWORD = 'secret'
    delete process.env.IDEA_POOL_TOKEN

    expect(getAuthMode()).toBe('password')
  })

  it('fails fast in production without credentials', () => {
    const previousNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    process.env.IDEA_POOL_AUTH_ENABLED = 'true'
    delete process.env.IDEA_POOL_PASSWORD
    delete process.env.IDEA_POOL_TOKEN

    expect(() => assertAuthConfiguration()).toThrow(/IDEA_POOL_PASSWORD/)

    process.env.NODE_ENV = previousNodeEnv
  })
})
