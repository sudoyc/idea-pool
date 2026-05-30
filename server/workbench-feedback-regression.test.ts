import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const appSource = readFileSync('src/App.tsx', 'utf8')
const cssSource = readFileSync('src/App.css', 'utf8')
const productModelSource = readFileSync('src/workbenchProductModel.ts', 'utf8')
const mockupSource = readFileSync('sketches/016-settings-console-mockup/index.html', 'utf8')

describe('workbench feedback regression contracts', () => {
  it('adds Inbox as a first-class drag target beside active and archived targets', () => {
    expect(productModelSource).toContain("Extract<IdeaStatus, 'INBOX' | 'PIPELINE' | 'TRASH'>")
    expect(productModelSource).toContain("status: 'INBOX'")
    expect(productModelSource.indexOf("status: 'INBOX'")).toBeLessThan(productModelSource.indexOf("status: 'PIPELINE'"))
    expect(productModelSource.indexOf("status: 'PIPELINE'")).toBeLessThan(productModelSource.indexOf("status: 'TRASH'"))
  })

  it('only exposes destructive permanent delete for archived ideas', () => {
    expect(appSource).toContain('deleteSelectedIdea')
    expect(appSource).toContain("idea.status === 'TRASH'")
    expect(appSource).toContain("t('action.deletePermanently')")
    expect(appSource).not.toContain("<button className=\"btn danger\" type=\"button\" onClick={deleteSelectedIdea}")
  })

  it('keeps the topbar status lane stable when status-message text changes', () => {
    expect(cssSource).toContain('.topbar-actions')
    expect(cssSource).toContain('grid-template-columns')
    expect(cssSource).toContain('.topbar-status-slot')
    expect(cssSource).toContain('minmax(160px')
    expect(appSource).toContain('topbar-status-slot')
  })

  it('applies the lens transition to empty states without replaying during drag', () => {
    expect(appSource).toContain('pool-transition-surface')
    expect(appSource).toContain('transitionMode')
    expect(appSource).toContain("transitionMode === 'lens'")
    expect(cssSource).toContain('.pool-transition-surface[data-transition="lens"] .card')
    expect(cssSource).toContain('.pool-transition-surface[data-transition="lens"] .empty-state')
    expect(cssSource).toContain('.workspace-wrapper.dragging-card .pool-transition-surface')
    expect(cssSource).toContain('animation: none')
  })

  it('rebuilds the settings mockup by mirroring current app layout and copy instead of inventing a separate console', () => {
    expect(mockupSource).toContain('data-mockup-source="current-app-settings"')
    expect(mockupSource).toContain('WORKBENCH')
    expect(mockupSource).toContain('灵感池视角')
    expect(mockupSource).toContain('全部灵感')
    expect(mockupSource).toContain('待整理')
    expect(mockupSource).toContain('进行中')
    expect(mockupSource).toContain('已归档')
    expect(mockupSource).toContain('settings-view-shell')
    expect(mockupSource).toContain('可编辑控制项')
    expect(mockupSource).not.toContain('Gemini handoff')
    expect(mockupSource).not.toContain('@keyframes panelDrift')
  })
})
