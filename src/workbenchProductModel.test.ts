import { describe, expect, it } from 'vitest'
import { agentEndpointSummary, settingsReadOnlyItems, workspaceModelTagline } from './workbenchProductModel'
import modelSource from './workbenchProductModel.ts?raw'

describe('workbench product model', () => {
  it('keeps the core mental model explicit for UI and docs', () => {
    expect(workspaceModelTagline).toBe('Local-first Kanban + Spatial Detail View + AI Augmentation')
  })

  it('defines real settings read-only items instead of legacy placeholder cards', () => {
    expect(settingsReadOnlyItems.map((item) => item.id)).toEqual(['mentalModel', 'aiBoundary', 'storage', 'security', 'agentRoutes'])
    expect(settingsReadOnlyItems.every((item) => item.description.length > 24)).toBe(true)
    expect(settingsReadOnlyItems.find((item) => item.id === 'agentRoutes')?.tags).toContain('/api/agent/v1/context')
    expect(settingsReadOnlyItems.find((item) => item.id === 'storage')?.tags).toContain('SQLite')
    expect(modelSource).not.toContain('buildSettingsSections')
  })

  it('summarizes the versioned agent surface for Settings and Inspector', () => {
    expect(agentEndpointSummary.basePath).toBe('/api/agent/v1')
    expect(agentEndpointSummary.endpoints).toEqual(
      expect.arrayContaining(['/context', '/schema', '/ideas', '/ideas/:id/complete', '/ideas/:id/agent-pack', '/ideas/:id/files']),
    )
  })
})
