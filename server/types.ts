export type IdeaStatus = 'INBOX' | 'PIPELINE' | 'TRASH'

export type IdeaSource = 'local' | 'agent' | 'import' | 'llm'

export type AiAnalysis = {
  mvpSuggestion: string
  risks: string[]
  firstActions: string[]
  boundaryNotes: string
}

export type IdeaRecord = {
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

export type AuthMode = 'disabled' | 'password' | 'token'
