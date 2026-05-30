import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const cssSource = readFileSync('src/App.css', 'utf8')

describe('polished interaction CSS contracts', () => {
  it('defines staggered blur-lift card animation and reduced-motion fallback', () => {
    expect(cssSource).toContain('@keyframes card-blur-lift')
    expect(cssSource).toContain('filter: blur(10px)')
    expect(cssSource).toContain('animation-delay: calc(var(--stagger-index) * 38ms)')
    expect(cssSource).toContain('@media (prefers-reduced-motion: reduce)')
    expect(cssSource).toContain('animation: none')
  })

  it('defines a distinct settings reveal and orbit scan animation', () => {
    expect(cssSource).toContain('@keyframes settings-reveal')
    expect(cssSource).toContain('@keyframes settings-orbit-scan')
  })
})
