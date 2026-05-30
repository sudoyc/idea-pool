import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const appSource = readFileSync('src/App.tsx', 'utf8')
const cssSource = readFileSync('src/App.css', 'utf8')
const modelSource = readFileSync('src/workbenchProductModel.ts', 'utf8')
const messagesSource = readFileSync('src/i18n/messages.ts', 'utf8')

describe('production settings surface contracts', () => {
  it('implements the index_2 centered flow layout in production instead of the earlier card grid', () => {
    expect(appSource).toContain('settings-container')
    expect(appSource).toContain('settings-section')
    expect(appSource).toContain('section-header')
    expect(appSource).toContain('setting-item')
    expect(appSource).toContain('setting-info')
    expect(appSource).toContain('setting-control')
    expect(cssSource).toContain('max-width: 768px')
    expect(cssSource).not.toContain('width: min(100%, 960px)')
    expect(cssSource).not.toContain('max-width: 1080px')
    expect(appSource).not.toContain('settings-grid')
    expect(appSource).not.toContain('settings-card--hero')
  })

  it('separates editable workspace configuration from read-only system mechanism status', () => {
    expect(appSource).toContain("t('settings.workspaceConfig.title')")
    expect(appSource).toContain("t('settings.systemStatus.title')")
    expect(appSource).toContain('settingsReadOnlyItems')
    expect(modelSource).toContain('buildSettingsReadOnlyItems')
    expect(modelSource).toContain("settings.readonly.mentalModel.label")
    expect(modelSource).toContain("settings.readonly.agentRoutes.label")
  })

  it('gives every editable setting a description and keeps controls in a fixed right lane', () => {
    expect(modelSource).toContain('description:')
    expect(modelSource).toContain("settings.control.workspaceName.description")
    expect(modelSource).toContain("settings.control.llmModel.description")
    expect(modelSource).toContain("settings.control.agentExposure.description")
    expect(cssSource).toContain('.setting-item')
    expect(cssSource).toContain('justify-content: space-between')
    expect(cssSource).toContain('.setting-control')
    expect(cssSource).toContain('width: 320px')
    expect(appSource).toContain('className="btn primary" disabled={saving}')
    expect(appSource).not.toContain('className="btn primary settings-action" disabled={saving}')
  })

  it('uses the actual Settings save control labels and read-only tags from i18n', () => {
    expect(messagesSource).toContain("'settings.workspaceConfig.title': '工作区配置'")
    expect(messagesSource).toContain("'settings.systemStatus.title': '系统机制与状态'")
    expect(messagesSource).toContain("'settings.control.workspaceName.description'")
    expect(messagesSource).toContain("'settings.readonly.storage.tags.sqlite'")
    expect(messagesSource).toContain("'settings.readonly.security.tags.agent'")
    expect(messagesSource).not.toContain("'settings.section.general.title'")
  })
})
