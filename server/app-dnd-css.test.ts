import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('drag overlay card styling', () => {
  it('does not add a nested transform to the dragged overlay card', () => {
    const appCss = readFileSync('src/App.css', 'utf8')

    expect(appCss).toContain('.overlay-card {')
    expect(appCss).toContain('transform: none;')
    expect(appCss).toContain('pointer-events: none;')
  })

  it('keeps single-pool workspace styling and hides classification targets until dragging', () => {
    const appCss = readFileSync('src/App.css', 'utf8')

    expect(appCss).toContain('.idea-pool')
    expect(appCss).toContain('repeat(auto-fill, minmax(')
    expect(appCss).toContain('.drag-classification-targets')
    expect(appCss).toContain('transform: translateX(112%)')
    expect(appCss).toContain('.workspace-wrapper.dragging-card .drag-classification-targets')
    expect(appCss).toContain('transform: translateX(0)')
  })
})
