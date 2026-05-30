import type { SettingsControl } from './workbenchProductModel'

export type WorkbenchSettings = Record<SettingsControl['key'], string>
export type SettingsFetch = typeof fetch

export const defaultWorkbenchSettings: WorkbenchSettings = {
  workspaceName: 'Personal Idea Workbench',
  llmModel: 'local-fallback',
  agentExposure: 'private',
}

export const loadWorkbenchSettings = async (fetcher: SettingsFetch = fetch): Promise<{ settings: WorkbenchSettings; usedDefaults: boolean }> => {
  try {
    const response = await fetcher('/api/settings')
    if (!response.ok) {
      return { settings: defaultWorkbenchSettings, usedDefaults: true }
    }
    const payload = (await response.json()) as { settings?: Partial<WorkbenchSettings> }
    return { settings: { ...defaultWorkbenchSettings, ...payload.settings }, usedDefaults: false }
  } catch {
    return { settings: defaultWorkbenchSettings, usedDefaults: true }
  }
}

export const saveWorkbenchSettings = async (settings: WorkbenchSettings, fetcher: SettingsFetch = fetch): Promise<boolean> => {
  try {
    const response = await fetcher('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    return response.ok
  } catch {
    return false
  }
}
