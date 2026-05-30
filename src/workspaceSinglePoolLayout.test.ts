import { describe, expect, it } from 'vitest'
import appSource from './App.tsx?raw'
import storeSource from './store/useIdeaStore.ts?raw'

describe('single-pool workspace layout source contract', () => {
  it('renders a single idea pool with drag-time classification targets instead of board columns', () => {
    expect(appSource).toContain('function IdeaPool')
    expect(appSource).toContain('function DragClassificationTargets')
    expect(appSource).not.toContain('<BoardColumn')
    expect(appSource).not.toContain('function InspectorRail')
  })

  it('keeps the dnd overlay portal', () => {
    expect(appSource).toContain('createPortal(')
    expect(appSource).toContain('document.body')
    expect(appSource).toContain('<DragOverlay')
  })

  it('keeps hidden classification targets out of the accessibility tree until dragging', () => {
    expect(appSource).toContain('function DragClassificationTargets({ isDragging }')
    expect(appSource).toContain('aria-hidden={!isDragging}')
    expect(appSource).toContain('<DragClassificationTargets isDragging={Boolean(activeDragId)} />')
  })

  it('keeps default AI guidance aligned with single-pool classification', () => {
    expect(storeSource).not.toMatch(/三个状态|三栏|AI Enriched/i)
    expect(storeSource).toContain('主视图保持为单一 idea pool')
  })
})
