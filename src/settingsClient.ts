import type { SettingsControlKey } from './workbenchProductModel'

type PersistedSettingsKey = Exclude<SettingsControlKey, 'llmApiKey'>

export type WorkbenchSettings = Record<PersistedSettingsKey, string> & {
  schemaVersion: number
  llmApiKeyConfigured: boolean
  llmApiKeyMasked: string
}
export type SettingsFetch = typeof fetch

export const defaultWorkbenchSettings: WorkbenchSettings = {
  schemaVersion: 2,
  workspaceName: 'Personal Idea Workbench',
  llmModel: 'local-fallback',
  embeddingModel: 'text-embedding-3-small',
  storagePath: './data/files',
  agentExposure: 'private',
  llmApiKeyConfigured: false,
  llmApiKeyMasked: '',
}

export const loadWorkbenchSettings = async (fetcher: SettingsFetch = fetch): Promise<{ settings: WorkbenchSettings; usedDefaults: boolean }> => {
  try {
    const response = await fetcher('/api/settings')
    if (!response.ok) {
      return { settings: defaultWorkbenchSettings, usedDefaults: true }
    }
    const payload = (await response.json()) as { settings?: Partial<WorkbenchSettings> & { llmApiKey?: string } }
    const safeSettings = { ...(payload.settings ?? {}) }
    delete safeSettings.llmApiKey
    return { settings: { ...defaultWorkbenchSettings, ...safeSettings }, usedDefaults: false }
  } catch {
    return { settings: defaultWorkbenchSettings, usedDefaults: true }
  }
}

export const saveWorkbenchSettings = async (settings: WorkbenchSettings, fetcher: SettingsFetch = fetch, llmApiKey?: string): Promise<boolean> => {
  try {
    const body = llmApiKey ? { ...settings, llmApiKey } : settings
    const response = await fetcher('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return response.ok
  } catch {
    return false
  }
}

export const triggerWorkbenchBackup = async (fetcher: SettingsFetch = fetch): Promise<{ ok: boolean; fileId?: string }> => {
  try {
    const response = await fetcher('/api/settings/backup', { method: 'POST' })
    if (!response.ok) return { ok: false }
    const payload = (await response.json()) as { file?: { id?: string } }
    return { ok: true, fileId: payload.file?.id }
  } catch {
    return { ok: false }
  }
}
