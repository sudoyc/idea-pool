import { accessSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const mockupPath = 'sketches/016-settings-console-mockup/index.html'

describe('settings interface mockup handoff', () => {
  it('ships a standalone settings mockup for design iteration', () => {
    expect(() => accessSync(mockupPath)).not.toThrow()
    const html = readFileSync(mockupPath, 'utf8')

    expect(html).toContain('<!doctype html>')
    expect(html).toContain('data-mockup-source="current-app-settings"')
    expect(html).toContain('WORKBENCH')
    expect(html).toContain('灵感池视角')
    expect(html).toContain('全部灵感')
    expect(html).toContain('待整理')
    expect(html).toContain('进行中')
    expect(html).toContain('已归档')
    expect(html).toContain('settings-view-shell')
    expect(html).toContain('可编辑控制项')
    expect(html).toContain('Agent API')
    expect(html).not.toContain('Gemini handoff')
    expect(html).not.toContain('@keyframes panelDrift')
  })
})
