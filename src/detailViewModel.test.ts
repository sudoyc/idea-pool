import { describe, expect, it } from 'vitest'
import { buildDetailSections } from './detailViewModel'
import type { WorkbenchIdea } from './workbenchTypes'

const baseIdea: WorkbenchIdea = {
  id: 'detail-seed',
  title: 'Personal Idea Workbench',
  summary: 'Make the detail overlay feel like a serious writing surface.',
  status: 'PIPELINE',
  source: 'local',
  tags: ['ux', 'detail'],
  whyNow: 'The workbench needs a durable foreground, not a generic inspector.',
  mvpScope: 'Stabilize hierarchy, files, events, and AI boundaries.',
  firstAction: 'Extract a view model before more UI drift accumulates.',
  scratchpad: '',
  aiEnriched: true,
  aiAnalysis: {
    mvpSuggestion: 'Keep the core writing fields visually primary.',
    risks: ['A right rail could dominate the layout again'],
    firstActions: ['Model the sections', 'Keep AI secondary'],
    boundaryNotes: 'AI only acts on the selected idea.',
  },
  sortOrder: 1,
  createdAt: '2026-05-30T00:00:00.000Z',
  updatedAt: '2026-05-30T01:00:00.000Z',
  archivedAt: null,
}

describe('detail view model', () => {
  it('returns a stable section order for the spatial detail foreground', () => {
    expect(buildDetailSections(baseIdea, 'zh').map((section) => section.id)).toEqual([
      'essence',
      'timing',
      'scope',
      'action',
      'aiBoundary',
      'files',
      'events',
      'metadata',
    ])
  })

  it('switches destructive actions between archive and permanent delete based on archived status', () => {
    const active = buildDetailSections(baseIdea, 'en')
    const archived = buildDetailSections({ ...baseIdea, status: 'TRASH', archivedAt: '2026-05-30T02:00:00.000Z' }, 'en')

    expect(active.find((section) => section.id === 'metadata')?.dangerAction).toMatchObject({ id: 'archive' })
    expect(archived.find((section) => section.id === 'metadata')?.dangerAction).toMatchObject({ id: 'deletePermanently' })
  })

  it('uses quiet i18n placeholders for empty primary writing fields', () => {
    const sparse = buildDetailSections({
      ...baseIdea,
      summary: '',
      whyNow: '',
      mvpScope: '',
      firstAction: '',
      scratchpad: '',
    }, 'zh')

    const essence = sparse.find((section) => section.id === 'essence')
    const timing = sparse.find((section) => section.id === 'timing')
    const scope = sparse.find((section) => section.id === 'scope')
    const action = sparse.find((section) => section.id === 'action')

    expect(essence?.fields[1]?.value).toBe('留空，等待明确')
    expect(timing?.fields[0]?.value).toBe('留空，等待明确')
    expect(scope?.fields[0]?.value).toBe('留空，等待明确')
    expect(action?.fields[0]?.value).toBe('留空，等待明确')
  })
})
