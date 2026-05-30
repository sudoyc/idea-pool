import { describe, expect, it } from 'vitest'
import {
  buildDragClassificationTargets,
  buildIdeaPoolLenses,
  buildSettingsControls,
  buildSettingsSections,
  buildSyncStatusCopy,
  dragClassificationTargets,
  ideaPoolLenses,
  settingsControls,
  syncStatusCopy,
  workspaceModelTagline,
} from './workbenchProductModel'
import modelSource from './workbenchProductModel.ts?raw'

describe('localized workbench product model', () => {
  it('keeps the core English product tagline stable as a technical mental model', () => {
    expect(workspaceModelTagline).toBe('Local-first Kanban + Spatial Detail View + AI Augmentation')
  })

  it('builds pool lenses in both Chinese and English', () => {
    const zh = buildIdeaPoolLenses('zh')
    const en = buildIdeaPoolLenses('en')

    expect(zh.map((lens) => lens.id)).toEqual(['ALL', 'INBOX', 'PIPELINE', 'TRASH'])
    expect(en.map((lens) => lens.id)).toEqual(['ALL', 'INBOX', 'PIPELINE', 'TRASH'])
    expect(zh[0]?.label).toBe('全部灵感')
    expect(en[0]?.label).toBe('All ideas')
    expect(zh[2]?.label).toBe('进行中')
    expect(en[2]?.label).toBe('Active work')
  })

  it('builds drag targets, settings sections, controls, and sync labels by locale', () => {
    expect(buildDragClassificationTargets('zh').map((target) => target.label)).toEqual(['待整理', '进行中', '搁置 / 归档'])
    expect(buildDragClassificationTargets('en').map((target) => target.label)).toEqual(['Unsorted pool', 'Active work', 'Parked / archive'])

    expect(buildSettingsSections('zh').find((section) => section.id === 'general')?.title).toBe('通用')
    expect(buildSettingsSections('en').find((section) => section.id === 'general')?.title).toBe('General')

    expect(buildSettingsControls('zh').find((control) => control.key === 'workspaceName')?.label).toBe('WORKSPACE 名称')
    expect(buildSettingsControls('en').find((control) => control.key === 'workspaceName')?.label).toBe('Workspace name')

    expect(buildSyncStatusCopy('zh').idle).toBe('本地更改已保存')
    expect(buildSyncStatusCopy('en').idle).toBe('Local changes saved')
  })

  it('defaults compatibility product-model exports to Chinese', () => {
    expect(ideaPoolLenses.map((lens) => lens.label)).toEqual(['全部灵感', '待整理', '进行中', '已归档'])
    expect(dragClassificationTargets.map((target) => target.label)).toEqual(['待整理', '进行中', '搁置 / 归档'])
    expect(settingsControls.find((control) => control.key === 'workspaceName')?.label).toBe('WORKSPACE 名称')
    expect(syncStatusCopy.idle).toBe('本地更改已保存')
  })

  it('keeps product-model visible copy behind the typed message catalog', () => {
    expect(modelSource).not.toContain("locale === 'zh'")
    expect(modelSource).not.toContain('locale === "zh"')
  })
})
