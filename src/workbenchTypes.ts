export type IdeaStatus = 'INBOX' | 'PIPELINE' | 'TRASH'

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
  tags: string[]
  whyNow: string
  scratchpad: string
  aiEnriched: boolean
  aiAnalysis?: AiAnalysis
  createdAt: string
  updatedAt: string
}

export type IdeaPatch = Partial<
  Pick<WorkbenchIdea, 'title' | 'summary' | 'status' | 'tags' | 'whyNow' | 'scratchpad' | 'aiEnriched' | 'aiAnalysis'>
>

export const statusLabels: Record<IdeaStatus, string> = {
  INBOX: 'Local Seeds',
  PIPELINE: 'AI Enriched',
  TRASH: 'Trash',
}

export const statusOrder: IdeaStatus[] = ['INBOX', 'PIPELINE', 'TRASH']
