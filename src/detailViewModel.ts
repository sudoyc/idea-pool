import { t } from './i18n/messages'
import type { Locale } from './i18n/types'
import type { WorkbenchIdea } from './workbenchTypes'

export type DetailSectionId = 'essence' | 'timing' | 'scope' | 'action' | 'aiBoundary' | 'files' | 'events' | 'metadata'

export type DetailFieldModel = {
  key: string
  label: string
  value: string
}

export type DetailDangerAction = {
  id: 'archive' | 'deletePermanently'
  label: string
}

export type DetailSectionModel = {
  id: DetailSectionId
  title: string
  fields: DetailFieldModel[]
  hint?: string
  dangerAction?: DetailDangerAction
}

const filled = (locale: Locale, value?: string | null) => (value && value.trim() ? value : t(locale, 'detail.field.empty'))

export const buildDetailSections = (idea: WorkbenchIdea, locale: Locale): DetailSectionModel[] => [
  {
    id: 'essence',
    title: t(locale, 'detail.section.essence'),
    fields: [
      { key: 'title', label: t(locale, 'detail.field.title'), value: filled(locale, idea.title) },
      { key: 'summary', label: t(locale, 'detail.field.summary'), value: filled(locale, idea.summary) },
    ],
  },
  {
    id: 'timing',
    title: t(locale, 'detail.section.whyNow'),
    fields: [{ key: 'whyNow', label: t(locale, 'detail.field.whyNow'), value: filled(locale, idea.whyNow) }],
  },
  {
    id: 'scope',
    title: t(locale, 'detail.section.mvpScope'),
    fields: [{ key: 'mvpScope', label: t(locale, 'detail.field.mvpScope'), value: filled(locale, idea.mvpScope) }],
  },
  {
    id: 'action',
    title: t(locale, 'detail.section.firstAction'),
    fields: [{ key: 'firstAction', label: t(locale, 'detail.field.firstAction'), value: filled(locale, idea.firstAction) }],
  },
  {
    id: 'aiBoundary',
    title: t(locale, 'detail.ai.title'),
    hint: t(locale, 'detail.ai.selectedOnly'),
    fields: [{ key: 'boundary', label: t(locale, 'detail.ai.boundary'), value: t(locale, 'detail.ai.selectedOnly') }],
  },
  {
    id: 'files',
    title: t(locale, 'detail.files.title'),
    hint: t(locale, 'detail.files.hint'),
    fields: [],
  },
  {
    id: 'events',
    title: t(locale, 'detail.section.events'),
    hint: t(locale, 'detail.events.empty'),
    fields: [],
  },
  {
    id: 'metadata',
    title: t(locale, 'detail.section.metadata'),
    dangerAction: idea.status === 'TRASH' ? { id: 'deletePermanently', label: t(locale, 'action.deletePermanently') } : { id: 'archive', label: t(locale, 'action.discard') },
    fields: [
      { key: 'status', label: t(locale, 'detail.field.status'), value: t(locale, `idea.status.${idea.status}`) },
      { key: 'source', label: t(locale, 'detail.field.source'), value: t(locale, `idea.source.${idea.source}`) },
      { key: 'updated', label: t(locale, 'detail.field.updated'), value: idea.updatedAt },
    ],
  },
]
