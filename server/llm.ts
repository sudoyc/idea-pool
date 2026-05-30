import type { AiAnalysis, IdeaRecord } from './types.js'

const fallbackAnalysis = (idea: IdeaRecord): AiAnalysis => ({
  mvpSuggestion: `围绕「${idea.title}」先做最小闭环：一条输入、一条输出、一个可保存的本地状态。`,
  risks: ['范围容易膨胀', '标签和状态模型可能过早复杂化'],
  firstActions: ['确认字段结构', '写一个本地 seed', '让详情页保存一次真实编辑'],
  boundaryNotes: 'LLM completion 当前使用本地 fallback。配置 LLM_API_KEY 后会调用远程模型。',
})

const parseJsonObject = (text: string): AiAnalysis | null => {
  try {
    const parsed = JSON.parse(text) as AiAnalysis
    if (!parsed.mvpSuggestion || !Array.isArray(parsed.risks) || !Array.isArray(parsed.firstActions)) return null
    return parsed
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
    try {
      return JSON.parse(match[0]) as AiAnalysis
    } catch {
      return null
    }
  }
}

const readRemoteError = async (response: Response) => {
  const text = await response.text()
  try {
    const parsed = JSON.parse(text) as { error?: string | { message?: string } }
    if (typeof parsed.error === 'string') return parsed.error
    if (parsed.error && typeof parsed.error === 'object' && typeof parsed.error.message === 'string') return parsed.error.message
  } catch {
    // ignore JSON parse failure and fall through to text
  }
  return text || `LLM request failed with status ${response.status}`
}

export const completeIdea = async (idea: IdeaRecord, notes = ''): Promise<AiAnalysis> => {
  const apiKey = process.env.LLM_API_KEY
  const baseUrl = process.env.LLM_BASE_URL ?? 'https://api.openai.com/v1'
  const model = process.env.LLM_MODEL ?? 'gpt-4o-mini'

  if (!apiKey) return fallbackAnalysis(idea)

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content:
            'You complete a personal project idea. Return strict JSON with keys: mvpSuggestion string, risks string[], firstActions string[], boundaryNotes string. Do not choose or move ideas.',
        },
        {
          role: 'user',
          content: JSON.stringify({ idea, notes }),
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(await readRemoteError(response))
  }

  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
  const content = payload.choices?.[0]?.message?.content ?? ''
  const parsed = parseJsonObject(content)
  if (!parsed) {
    throw new Error('LLM response did not contain a valid AI analysis JSON payload')
  }
  return parsed
}
