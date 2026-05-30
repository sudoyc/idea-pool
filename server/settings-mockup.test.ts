import { accessSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const mockupPath = 'sketches/016-settings-console-mockup/index.html'

describe('settings interface mockup handoff', () => {
  it('ships a standalone settings mockup for design iteration', () => {
    expect(() => accessSync(mockupPath)).not.toThrow()
    const html = readFileSync(mockupPath, 'utf8')

    expect(html).toContain('<!doctype html>')
    expect(html).toContain('Settings Console')
    expect(html).toContain('Language Switch')
    expect(html).toContain('Agent API')
    expect(html).toContain('Gemini handoff')
    expect(html).toContain('@keyframes panelDrift')
  })
})
