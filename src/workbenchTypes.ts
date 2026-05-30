export type IdeaStatus = 'INBOX' | 'PIPELINE' | 'TRASH'

export type IdeaPoolLens = 'ALL' | IdeaStatus

export type WorkspaceScreen = 'WORKBENCH' | 'SETTINGS'

export type IdeaSource = 'local' | 'agent' | 'import' | 'llm'

export type AiAnalysis = {
  mvpSuggestion: string
  risks: string[]
  firstActions: string[]
  boundaryNotes: string
}

export type WorkbenchIdea = {
  id: string
  title: string
  summary: string
  status: IdeaStatus
  source: IdeaSource
  tags: string[]
  whyNow: string
  mvpScope?: string
  firstAction?: string
  scratchpad: string
  aiEnriched: boolean
  aiAnalysis?: AiAnalysis
  sortOrder: number
  createdAt: string
  updatedAt: string
  archivedAt?: string | null
}

export type IdeaPatch = Partial<
  Pick<
    WorkbenchIdea,
    'title' | 'summary' | 'status' | 'tags' | 'whyNow' | 'mvpScope' | 'firstAction' | 'scratchpad' | 'aiEnriched' | 'aiAnalysis'
  >
>

export const statusLabels: Record<IdeaStatus, string> = {
  INBOX: '待整理',
  PIPELINE: '进行中',
  TRASH: '已归档',
}

export const statusOrder: IdeaStatus[] = ['INBOX', 'PIPELINE', 'TRASH']
