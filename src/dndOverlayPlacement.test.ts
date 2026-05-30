import { describe, expect, it } from 'vitest'
import appSource from './App.tsx?raw'

describe('drag overlay placement', () => {
  it('renders the dnd-kit drag overlay through a document.body portal', () => {
    expect(appSource).toContain("import { createPortal } from 'react-dom'")
    expect(appSource).toContain('createPortal(')
    expect(appSource).toContain('document.body')
    expect(appSource).toContain('<DragOverlay')
  })
})
