import { describe, expect, it, vi } from 'vitest'
import { defaultWorkbenchSettings, loadWorkbenchSettings, saveWorkbenchSettings, triggerWorkbenchBackup } from './settingsClient'

const jsonResponse = (body: unknown, init: ResponseInit = {}) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' }, ...init })

describe('settings client', () => {
  it('loads Settings v2 from /api/settings and merges missing fields with local defaults', async () => {
    const fetcher = vi.fn(async () => jsonResponse({ settings: { workspaceName: 'Private Lab', llmApiKeyConfigured: true, llmApiKeyMasked: '••••3456' } }))

    const result = await loadWorkbenchSettings(fetcher)

    expect(fetcher).toHaveBeenCalledWith('/api/settings')
    expect(result).toEqual({
      settings: { ...defaultWorkbenchSettings, workspaceName: 'Private Lab', llmApiKeyConfigured: true, llmApiKeyMasked: '••••3456' },
      usedDefaults: false,
    })
    expect(result.settings).not.toHaveProperty('llmApiKey')
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

  it('saves settings through the existing PUT /api/settings endpoint while keeping the loaded state sanitized', async () => {
    const fetcher = vi.fn(async () => jsonResponse({ settings: defaultWorkbenchSettings }))

    const saved = await saveWorkbenchSettings({ ...defaultWorkbenchSettings, agentExposure: 'private-vps' }, fetcher, 'sk-live...9999')

    expect(saved).toBe(true)
    expect(fetcher).toHaveBeenCalledWith('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...defaultWorkbenchSettings, agentExposure: 'private-vps', llmApiKey: 'sk-live...9999' }),
    })
  })

  it('triggers a settings backup export through the control-plane endpoint', async () => {
    const fetcher = vi.fn(async () => jsonResponse({ file: { id: 'file-backup', kind: 'export' }, manifest: { schemaVersion: 1 } }, { status: 201 }))

    const backup = await triggerWorkbenchBackup(fetcher)

    expect(backup).toEqual({ ok: true, fileId: 'file-backup' })
    expect(fetcher).toHaveBeenCalledWith('/api/settings/backup', { method: 'POST' })
  })
})
