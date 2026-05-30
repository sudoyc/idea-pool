import { describe, expect, it } from 'vitest'
import { filePanelActions, settingsControls, settingsRuntimeItems, settingsBackupAction, syncStatusCopy } from './workbenchProductModel'

describe('phase 2 product model contracts', () => {
  it('describes editable settings controls without turning Settings into placeholder copy', () => {
    expect(settingsControls.map((control) => control.key)).toEqual(['workspaceName', 'llmModel', 'embeddingModel', 'llmApiKey', 'storagePath', 'agentExposure'])
    expect(settingsControls.every((control) => control.storageKey.startsWith('settings.'))).toBe(true)
    expect(settingsControls.find((control) => control.key === 'llmApiKey')?.input).toBe('password')
    expect(settingsControls.find((control) => control.key === 'storagePath')?.readOnlyRuntime).toBe(true)
  })

  it('separates runtime explanation and backup action from editable settings', () => {
    expect(settingsRuntimeItems.map((item) => item.id)).toEqual(['frontendPort', 'backendAddress', 'agentEndpoint', 'storageRoot'])
    expect(settingsRuntimeItems.find((item) => item.id === 'agentEndpoint')?.tags).toContain('/api/agent/v1')
    expect(settingsBackupAction).toMatchObject({ id: 'export-backup', endpoint: '/api/settings/backup', method: 'POST' })
  })

  it('describes durable file panel actions for idea handoff artifacts', () => {
    expect(filePanelActions.map((action) => action.id)).toEqual(['upload-markdown', 'download-file', 'delete-file'])
    expect(filePanelActions.find((action) => action.id === 'upload-markdown')?.endpoint).toBe('/api/ideas/:id/files/content')
  })

  it('keeps sync status copy explicit for local-first remote sync states', () => {
    expect(syncStatusCopy).toMatchObject({
      idle: '本地更改已保存',
      queued: '远端同步已排队 (queued)',
      syncing: '正在同步远端副本',
      synced: '远端副本已最新',
      error: '远端同步需要处理',
    })
  })
})
