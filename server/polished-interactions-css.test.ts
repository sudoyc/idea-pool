import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const cssSource = readFileSync('src/App.css', 'utf8')

describe('polished interaction CSS contracts', () => {
  it('defines lens-only blur-lift transitions, including empty states, and suppresses replay while dragging', () => {
    expect(cssSource).toContain('@keyframes card-blur-lift')
    expect(cssSource).toContain('filter: blur(10px)')
    expect(cssSource).toContain('.pool-transition-surface[data-transition="lens"] .card')
    expect(cssSource).toContain('.pool-transition-surface[data-transition="lens"] .empty-state')
    expect(cssSource).toContain('animation-delay: calc(var(--stagger-index) * 38ms)')
    expect(cssSource).toContain('.workspace-wrapper.dragging-card .pool-transition-surface')
    expect(cssSource).toContain('@media (prefers-reduced-motion: reduce)')
    expect(cssSource).toContain('animation: none')
  })

  it('stabilizes topbar status alignment when message copy length changes', () => {
    expect(cssSource).toContain('.topbar-status-slot')
    expect(cssSource).toContain('minmax(160px')
    expect(cssSource).toContain('justify-self: end')
    expect(cssSource).toContain('white-space: nowrap')
  })

  it('defines a distinct settings reveal and form-flow surface', () => {
    expect(cssSource).toContain('@keyframes settings-reveal')
    expect(cssSource).toContain('.settings-container')
    expect(cssSource).toContain('.settings-form-flow')
  })
})
