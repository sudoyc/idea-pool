import { describe, expect, it, vi } from 'vitest'
import { defaultWorkbenchSettings, loadWorkbenchSettings, saveWorkbenchSettings } from './settingsClient'

const jsonResponse = (body: unknown, init: ResponseInit = {}) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' }, ...init })

describe('settings client', () => {
  it('loads settings from /api/settings and merges missing fields with local defaults', async () => {
    const fetcher = vi.fn(async () => jsonResponse({ settings: { workspaceName: 'Private Lab' } }))

    const result = await loadWorkbenchSettings(fetcher)

    expect(fetcher).toHaveBeenCalledWith('/api/settings')
    expect(result).toEqual({
      settings: { ...defaultWorkbenchSettings, workspaceName: 'Private Lab' },
      usedDefaults: false,
    })
  })

  it('surfaces local defaults when /api/settings returns a non-ok response', async () => {
    const fetcher = vi.fn(async () => jsonResponse({ error: 'unauthorized' }, { status: 401 }))

    const result = await loadWorkbenchSettings(fetcher)

    expect(result).toEqual({ settings: defaultWorkbenchSettings, usedDefaults: true })
  })

  it('surfaces local defaults when /api/settings is unreachable', async () => {
    const fetcher = vi.fn(async () => {
      throw new Error('network down')
    })

    const result = await loadWorkbenchSettings(fetcher)

    expect(result).toEqual({ settings: defaultWorkbenchSettings, usedDefaults: true })
  })

  it('saves settings through the existing PUT /api/settings endpoint', async () => {
    const fetcher = vi.fn(async () => jsonResponse({ settings: defaultWorkbenchSettings }))

    const saved = await saveWorkbenchSettings({ ...defaultWorkbenchSettings, agentExposure: 'private-vps' }, fetcher)

    expect(saved).toBe(true)
    expect(fetcher).toHaveBeenCalledWith('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...defaultWorkbenchSettings, agentExposure: 'private-vps' }),
    })
  })
})
