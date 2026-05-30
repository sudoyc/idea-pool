import { defaultLocale } from './i18n/messages'
import { t } from './i18n/messages'
import type { Locale } from './i18n/types'
import type { IdeaPoolLens, IdeaStatus } from './workbenchTypes'

export type SettingsReadOnlyItem = {
  id: 'mentalModel' | 'aiBoundary' | 'storage' | 'security' | 'agentRoutes'
  label: string
  description: string
  tags: string[]
}

export type SettingsRuntimeItem = {
  id: 'frontendPort' | 'backendAddress' | 'agentEndpoint' | 'storageRoot'
  label: string
  description: string
  tags: string[]
}

export type IdeaPoolLensModel = {
  id: IdeaPoolLens
  label: string
  description: string
}

export type DragClassificationTarget = {
  status: Extract<IdeaStatus, 'INBOX' | 'PIPELINE' | 'TRASH'>
  label: string
  description: string
}

export type SettingsControlKey = 'workspaceName' | 'llmModel' | 'embeddingModel' | 'llmApiKey' | 'storagePath' | 'agentExposure'

export type SettingsControl = {
  key: SettingsControlKey
  label: string
  description: string
  storageKey: string
  input: 'text' | 'select' | 'password'
  options?: string[]
  readOnlyRuntime?: boolean
}

export type SettingsBackupAction = {
  id: 'export-backup'
  label: string
  description: string
  endpoint: '/api/settings/backup'
  method: 'POST'
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
  { status: 'INBOX', label: t(locale, 'drag.target.INBOX.label'), description: t(locale, 'drag.target.INBOX.description') },
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
    description: t(locale, 'settings.control.workspaceName.description'),
    storageKey: 'settings.workspaceName',
    input: 'text',
  },
  {
    key: 'llmModel',
    label: t(locale, 'settings.control.llmModel.label'),
    description: t(locale, 'settings.control.llmModel.description'),
    storageKey: 'settings.llmModel',
    input: 'text',
  },
  {
    key: 'embeddingModel',
    label: t(locale, 'settings.control.embeddingModel.label'),
    description: t(locale, 'settings.control.embeddingModel.description'),
    storageKey: 'settings.embeddingModel',
    input: 'text',
  },
  {
    key: 'llmApiKey',
    label: t(locale, 'settings.control.llmApiKey.label'),
    description: t(locale, 'settings.control.llmApiKey.description'),
    storageKey: 'settings.llmApiKey',
    input: 'password',
  },
  {
    key: 'storagePath',
    label: t(locale, 'settings.control.storagePath.label'),
    description: t(locale, 'settings.control.storagePath.description'),
    storageKey: 'settings.storagePath',
    input: 'text',
    readOnlyRuntime: true,
  },
  {
    key: 'agentExposure',
    label: t(locale, 'settings.control.agentExposure.label'),
    description: t(locale, 'settings.control.agentExposure.description'),
    storageKey: 'settings.agentExposure',
    input: 'select',
    options: ['private', 'private-vps', 'local-only'],
  },
]

export const settingsControls: SettingsControl[] = buildSettingsControls(defaultLocale)

export const buildSettingsReadOnlyItems = (locale: Locale): SettingsReadOnlyItem[] => [
  {
    id: 'mentalModel',
    label: t(locale, 'settings.readonly.mentalModel.label'),
    description: t(locale, 'settings.readonly.mentalModel.description'),
    tags: [workspaceModelTagline],
  },
  {
    id: 'aiBoundary',
    label: t(locale, 'settings.readonly.aiBoundary.label'),
    description: t(locale, 'settings.readonly.aiBoundary.description'),
    tags: [t(locale, 'settings.readonly.aiBoundary.tags.selectedIdea')],
  },
  {
    id: 'storage',
    label: t(locale, 'settings.readonly.storage.label'),
    description: t(locale, 'settings.readonly.storage.description'),
    tags: [t(locale, 'settings.readonly.storage.tags.sqlite'), t(locale, 'settings.readonly.storage.tags.files')],
  },
  {
    id: 'security',
    label: t(locale, 'settings.readonly.security.label'),
    description: t(locale, 'settings.readonly.security.description'),
    tags: [t(locale, 'settings.readonly.security.tags.web'), t(locale, 'settings.readonly.security.tags.agent')],
  },
  {
    id: 'agentRoutes',
    label: t(locale, 'settings.readonly.agentRoutes.label'),
    description: t(locale, 'settings.readonly.agentRoutes.description'),
    tags: ['/api/agent/v1/context', '/api/agent/v1/ideas/:id/files'],
  },
]

export const settingsReadOnlyItems: SettingsReadOnlyItem[] = buildSettingsReadOnlyItems(defaultLocale)

export const buildSettingsRuntimeItems = (locale: Locale): SettingsRuntimeItem[] => [
  {
    id: 'frontendPort',
    label: t(locale, 'settings.runtime.frontendPort.label'),
    description: t(locale, 'settings.runtime.frontendPort.description'),
    tags: ['Vite :5173', 'Prod :3000'],
  },
  {
    id: 'backendAddress',
    label: t(locale, 'settings.runtime.backendAddress.label'),
    description: t(locale, 'settings.runtime.backendAddress.description'),
    tags: ['/api/*', 'Express'],
  },
  {
    id: 'agentEndpoint',
    label: t(locale, 'settings.runtime.agentEndpoint.label'),
    description: t(locale, 'settings.runtime.agentEndpoint.description'),
    tags: ['/api/agent/v1', 'Bearer token'],
  },
  {
    id: 'storageRoot',
    label: t(locale, 'settings.runtime.storageRoot.label'),
    description: t(locale, 'settings.runtime.storageRoot.description'),
    tags: ['./data/files', 'backup exports'],
  },
]

export const settingsRuntimeItems: SettingsRuntimeItem[] = buildSettingsRuntimeItems(defaultLocale)

export const buildSettingsBackupAction = (locale: Locale): SettingsBackupAction => ({
  id: 'export-backup',
  label: t(locale, 'settings.backup.action'),
  description: t(locale, 'settings.backup.description'),
  endpoint: '/api/settings/backup',
  method: 'POST',
})

export const settingsBackupAction: SettingsBackupAction = buildSettingsBackupAction(defaultLocale)

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
  failed: t(locale, 'sync.failed'),
})

export const syncStatusCopy = buildSyncStatusCopy(defaultLocale)
