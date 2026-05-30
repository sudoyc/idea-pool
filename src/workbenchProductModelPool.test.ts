import { describe, expect, it } from 'vitest'
import { dragClassificationTargets, ideaPoolLenses, settingsSections, workspacePoolModelCopy } from './workbenchProductModel'

describe('single-pool workspace product model', () => {
  it('defines sidebar lenses that adjust the idea pool instead of permanent board columns', () => {
    expect(ideaPoolLenses.map((lens) => lens.id)).toEqual(['ALL', 'INBOX', 'PIPELINE', 'TRASH'])
    expect(ideaPoolLenses.map((lens) => lens.label)).toEqual(['全部灵感', '待整理', '进行中', '已归档'])
    expect(ideaPoolLenses.every((lens) => lens.description.length > 20)).toBe(true)
  })

  it('defines only drag-time classification targets for idea status changes', () => {
    expect(dragClassificationTargets.map((target) => target.status)).toEqual(['INBOX', 'PIPELINE', 'TRASH'])
    expect(dragClassificationTargets.map((target) => target.label)).toEqual(['待整理', '进行中', '搁置 / 归档'])
    expect(dragClassificationTargets.every((target) => target.description.length > 10)).toBe(true)
  })

  it('states that status is metadata and classification is a drag interaction', () => {
    expect(workspacePoolModelCopy.mainView).toContain('idea pool')
    expect(workspacePoolModelCopy.statusModel).toContain('元数据')
    expect(workspacePoolModelCopy.classification).toContain('拖拽')
  })

  it('does not describe the workspace as a three-column status board in settings copy', () => {
    const serializedCopy = JSON.stringify({ workspacePoolModelCopy, settingsSections })
    expect(serializedCopy).not.toMatch(/three-column|permanent columns|visible as durable work states/i)
  })
})
