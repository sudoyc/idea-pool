import { describe, expect, it } from 'vitest'
import { filePanelActions, settingsControls, syncStatusCopy } from './workbenchProductModel'

describe('phase 2 product model contracts', () => {
  it('describes editable settings controls without turning Settings into placeholder copy', () => {
    expect(settingsControls.map((control) => control.key)).toEqual(['workspaceName', 'llmModel', 'agentExposure'])
    expect(settingsControls.every((control) => control.storageKey.startsWith('settings.'))).toBe(true)
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
