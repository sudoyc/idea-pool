import { describe, expect, it } from 'vitest'
import { agentEndpointSummary, settingsSections, workspaceModelTagline } from './workbenchProductModel'

describe('workbench product model', () => {
  it('keeps the core mental model explicit for UI and docs', () => {
    expect(workspaceModelTagline).toBe('Local-first Kanban + Spatial Detail View + AI Augmentation')
  })

  it('defines real settings sections instead of placeholder cards', () => {
    expect(settingsSections.map((section) => section.id)).toEqual(['general', 'ai', 'agent', 'storage', 'security'])
    expect(settingsSections.every((section) => section.summary.length > 24)).toBe(true)
    expect(settingsSections.find((section) => section.id === 'agent')?.facts).toContain('/api/agent/v1/context')
    expect(settingsSections.find((section) => section.id === 'storage')?.facts).toContain('SQLite + data/files')
  })

  it('summarizes the versioned agent surface for Settings and Inspector', () => {
    expect(agentEndpointSummary.basePath).toBe('/api/agent/v1')
    expect(agentEndpointSummary.endpoints).toEqual(
      expect.arrayContaining(['/context', '/schema', '/ideas', '/ideas/:id/complete', '/ideas/:id/agent-pack', '/ideas/:id/files']),
    )
  })
})
