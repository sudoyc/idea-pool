import { defaultLocale } from './i18n/messages'
import { t } from './i18n/messages'
import type { Locale } from './i18n/types'
import type { IdeaPoolLens, IdeaStatus } from './workbenchTypes'

export type SettingsSection = {
  id: 'general' | 'ai' | 'agent' | 'storage' | 'security'
  title: string
  summary: string
  facts: string[]
}

export type IdeaPoolLensModel = {
  id: IdeaPoolLens
  label: string
  description: string
}

export type DragClassificationTarget = {
  status: Extract<IdeaStatus, 'PIPELINE' | 'TRASH'>
  label: string
  description: string
}

export type SettingsControl = {
  key: 'workspaceName' | 'llmModel' | 'agentExposure'
  label: string
  storageKey: string
  input: 'text' | 'select'
  options?: string[]
}

export type FilePanelAction = {
  id: 'upload-markdown' | 'download-file' | 'delete-file'
  label: string
  endpoint: string
  method: 'POST' | 'GET' | 'DELETE'
}

export const workspaceModelTagline = 'Local-first Kanban + Spatial Detail View + AI Augmentation'

export const buildIdeaPoolLenses = (locale: Locale): IdeaPoolLensModel[] => [
  { id: 'ALL', label: t(locale, 'idea.lens.ALL.label'), description: t(locale, 'idea.lens.ALL.description') },
  { id: 'INBOX', label: t(locale, 'idea.lens.INBOX.label'), description: t(locale, 'idea.lens.INBOX.description') },
  { id: 'PIPELINE', label: t(locale, 'idea.lens.PIPELINE.label'), description: t(locale, 'idea.lens.PIPELINE.description') },
  { id: 'TRASH', label: t(locale, 'idea.lens.TRASH.label'), description: t(locale, 'idea.lens.TRASH.description') },
]

export const ideaPoolLenses: IdeaPoolLensModel[] = buildIdeaPoolLenses(defaultLocale)

export const buildDragClassificationTargets = (locale: Locale): DragClassificationTarget[] => [
  { status: 'PIPELINE', label: t(locale, 'drag.target.PIPELINE.label'), description: t(locale, 'drag.target.PIPELINE.description') },
  { status: 'TRASH', label: t(locale, 'drag.target.TRASH.label'), description: t(locale, 'drag.target.TRASH.description') },
]

export const dragClassificationTargets: DragClassificationTarget[] = buildDragClassificationTargets(defaultLocale)

export const buildWorkspacePoolModelCopy = (locale: Locale) => ({
  mainView: t(locale, 'workbench.poolModel.mainView'),
  statusModel: t(locale, 'workbench.poolModel.statusModel'),
  classification: t(locale, 'workbench.poolModel.classification'),
})

export const workspacePoolModelCopy = buildWorkspacePoolModelCopy(defaultLocale)

export const agentEndpointSummary = {
  basePath: '/api/agent/v1',
  endpoints: ['/context', '/schema', '/ideas', '/ideas/:id/complete', '/ideas/:id/agent-pack', '/ideas/:id/files'],
} as const

export const buildSettingsControls = (locale: Locale): SettingsControl[] => [
  {
    key: 'workspaceName',
    label: t(locale, 'settings.control.workspaceName.label'),
    storageKey: 'settings.workspaceName',
    input: 'text',
  },
  {
    key: 'llmModel',
    label: t(locale, 'settings.control.llmModel.label'),
    storageKey: 'settings.llmModel',
    input: 'text',
  },
  {
    key: 'agentExposure',
    label: t(locale, 'settings.control.agentExposure.label'),
    storageKey: 'settings.agentExposure',
    input: 'select',
    options: ['private', 'private-vps', 'local-only'],
  },
]

export const settingsControls: SettingsControl[] = buildSettingsControls(defaultLocale)

export const filePanelActions: FilePanelAction[] = [
  {
    id: 'upload-markdown',
    label: t(defaultLocale, 'action.uploadMarkdown'),
    endpoint: '/api/ideas/:id/files/content',
    method: 'POST',
  },
  {
    id: 'download-file',
    label: t(defaultLocale, 'action.download'),
    endpoint: '/api/files/:id/download',
    method: 'GET',
  },
  {
    id: 'delete-file',
    label: t(defaultLocale, 'action.delete'),
    endpoint: '/api/files/:id',
    method: 'DELETE',
  },
]

export const buildSyncStatusCopy = (locale: Locale) => ({
  idle: t(locale, 'sync.idle'),
  queued: t(locale, 'sync.queued'),
  syncing: t(locale, 'sync.syncing'),
  synced: t(locale, 'sync.synced'),
  error: t(locale, 'sync.error'),
})

export const syncStatusCopy = buildSyncStatusCopy(defaultLocale)

export const buildSettingsSections = (locale: Locale): SettingsSection[] => [
  {
    id: 'general',
    title: t(locale, 'settings.section.general.title'),
    summary: t(locale, 'settings.section.general.summary'),
    facts: [workspaceModelTagline, t(locale, 'settings.section.general.fact.status')],
  },
  {
    id: 'ai',
    title: t(locale, 'settings.section.ai.title'),
    summary: t(locale, 'settings.section.ai.summary'),
    facts: [t(locale, 'settings.section.ai.fact.selected'), t(locale, 'settings.section.ai.fact.human')],
  },
  {
    id: 'agent',
    title: t(locale, 'settings.section.agent.title'),
    summary: t(locale, 'settings.section.agent.summary'),
    facts: ['/api/agent/v1/context', '/api/agent/v1/schema', '/api/agent/v1/ideas'],
  },
  {
    id: 'storage',
    title: t(locale, 'settings.section.storage.title'),
    summary: t(locale, 'settings.section.storage.summary'),
    facts: [t(locale, 'settings.section.storage.fact.sqlite'), t(locale, 'settings.section.storage.fact.remote')],
  },
  {
    id: 'security',
    title: t(locale, 'settings.section.security.title'),
    summary: t(locale, 'settings.section.security.summary'),
    facts: [t(locale, 'settings.section.security.fact.session'), t(locale, 'settings.section.security.fact.token')],
  },
]

export const settingsSections: SettingsSection[] = buildSettingsSections(defaultLocale)
