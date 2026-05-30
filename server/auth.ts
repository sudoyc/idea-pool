import { createHmac, timingSafeEqual } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import type { AuthMode } from './types.js'

const sessionCookieName = 'idea_pool_session'
const sessionTtlMs = 1000 * 60 * 60 * 24 * 30

type SessionPayload = {
  exp: number
  kind: 'ui'
}

const getAuthEnabled = () => process.env.IDEA_POOL_AUTH_ENABLED !== 'false'

export const getAuthMode = (): AuthMode => {
  if (!getAuthEnabled()) return 'disabled'
  if (process.env.IDEA_POOL_PASSWORD) return 'password'
  if (process.env.IDEA_POOL_TOKEN) return 'token'
  return 'disabled'
}

const getSessionSecret = () => process.env.IDEA_POOL_SESSION_SECRET ?? process.env.IDEA_POOL_TOKEN ?? process.env.IDEA_POOL_PASSWORD ?? 'dev-secret'

export const assertAuthConfiguration = () => {
  if (!getAuthEnabled()) return
  const hasCredential = Boolean(process.env.IDEA_POOL_PASSWORD || process.env.IDEA_POOL_TOKEN)
  if (process.env.NODE_ENV === 'production' && !hasCredential) {
    throw new Error('Auth is enabled in production but IDEA_POOL_PASSWORD / IDEA_POOL_TOKEN is not configured.')
  }
  if (process.env.NODE_ENV === 'production' && !process.env.IDEA_POOL_SESSION_SECRET) {
    throw new Error('IDEA_POOL_SESSION_SECRET must be configured in production.')
  }
}

const sign = (value: string) => createHmac('sha256', getSessionSecret()).update(value).digest('base64url')

const encodeSession = (payload: SessionPayload) => {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${encoded}.${sign(encoded)}`
}

const decodeSession = (value: string | undefined): SessionPayload | null => {
  if (!value) return null
  const [encoded, signature] = value.split('.')
  if (!encoded || !signature) return null

  const expected = sign(encoded)
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString()) as SessionPayload
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

const parseCookies = (request: Request) => {
  const header = request.header('cookie') ?? ''
  return header
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((result, pair) => {
      const [key, ...rest] = pair.split('=')
      result[key] = decodeURIComponent(rest.join('='))
      return result
    }, {})
}

const getBearerToken = (request: Request) => {
  const header = request.header('authorization') ?? ''
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length) : ''
}

const hasValidToken = (request: Request) => {
  const expected = process.env.IDEA_POOL_TOKEN
  return Boolean(expected) && getBearerToken(request) === expected
}

const hasValidSession = (request: Request) => {
  const cookies = parseCookies(request)
  return Boolean(decodeSession(cookies[sessionCookieName]))
}

export const getSessionState = (request: Request) => {
  const authEnabled = getAuthEnabled()
  const authMode = getAuthMode()
  if (!authEnabled || authMode === 'disabled') {
    return { authEnabled: false, authMode, authenticated: true, principal: 'disabled' as const }
  }

  if (hasValidSession(request)) {
    return { authEnabled: true, authMode, authenticated: true, principal: 'session' as const }
  }

  if (hasValidToken(request)) {
    return { authEnabled: true, authMode, authenticated: true, principal: 'token' as const }
  }

  return { authEnabled: true, authMode, authenticated: false, principal: null }
}

const setSessionCookie = (response: Response) => {
  response.cookie(sessionCookieName, encodeSession({ kind: 'ui', exp: Date.now() + sessionTtlMs }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: sessionTtlMs,
    path: '/',
  })
}

const clearSessionCookie = (response: Response) => {
  response.clearCookie(sessionCookieName, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' })
}

export const login = (request: Request, response: Response) => {
  const authMode = getAuthMode()
  if (!getAuthEnabled() || authMode === 'disabled') {
    response.json({ authEnabled: false, authMode, authenticated: true, principal: 'disabled' })
    return
  }

  const password = typeof request.body?.password === 'string' ? request.body.password : ''
  const token = typeof request.body?.token === 'string' ? request.body.token : ''
  const expectedPassword = process.env.IDEA_POOL_PASSWORD
  const expectedToken = process.env.IDEA_POOL_TOKEN
  const valid = (expectedPassword && password === expectedPassword) || (expectedToken && token === expectedToken)

  if (!valid) {
    response.status(401).json({ error: 'Invalid credentials', authEnabled: true, authMode, authenticated: false })
    return
  }

  setSessionCookie(response)
  response.json({ authEnabled: true, authMode, authenticated: true, principal: 'session' })
}

export const logout = (_request: Request, response: Response) => {
  clearSessionCookie(response)
  response.json({ ok: true })
}

export const session = (request: Request, response: Response) => {
  response.json(getSessionState(request))
}

export const requireSessionOrToken = (request: Request, response: Response, next: NextFunction) => {
  const state = getSessionState(request)
  if (state.authenticated) {
    next()
    return
  }

  response.status(401).json({ error: 'Unauthorized', authEnabled: state.authEnabled, authMode: state.authMode })
}

export const requireSession = (request: Request, response: Response, next: NextFunction) => {
  const state = getSessionState(request)
  if (!state.authEnabled || state.principal === 'session' || state.principal === 'disabled') {
    next()
    return
  }

  response.status(401).json({ error: 'Session required', authEnabled: state.authEnabled, authMode: state.authMode })
}

export const requireAgentToken = (request: Request, response: Response, next: NextFunction) => {
  if (!getAuthEnabled()) {
    next()
    return
  }

  if (hasValidToken(request)) {
    next()
    return
  }

  response.status(401).json({ error: 'Unauthorized' })
}
