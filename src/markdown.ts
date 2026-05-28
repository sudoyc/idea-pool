import type { GeneratedIdea, IdeaRequest } from './types'

const list = (items: string[]) => items.map((item) => `  - ${item}`).join('\n')

export const toIdeaMarkdown = (ideas: GeneratedIdea[], request: IdeaRequest) => {
  const lines = [
    '# Vibe Coding 灵感推荐',
    '',
    `- 当前心情/方向：${request.context || '未填写'}`,
    `- 可用时间：${request.timeBudget}`,
    `- 偏好技术栈：${request.techStack || '未填写'}`,
    `- 约束：${request.constraints || '未填写'}`,
    `- 输出数量：${ideas.length}`,
    '',
    '---',
    '',
    ...ideas.flatMap((idea, index) => [
      `## ${index + 1}. ${idea.title}`,
      '',
      `- 优先级：${idea.priority ?? 'P2'}`,
      `- 分类：${idea.category}`,
      `- 匹配分：${idea.rankScore}`,
      `- 匹配词：${idea.matchedTerms.length > 0 ? idea.matchedTerms.join('、') : '默认推荐'}`,
      '',
      idea.summary,
      '',
      `**为什么适合现在做：** ${idea.whyNow}`,
      '',
      `**MVP：** ${idea.mvp}`,
      '',
      `**首个 30 分钟动作：** ${idea.firstStep}`,
      '',
      '**推荐技术栈：**',
      list(idea.techStack),
      '',
      '**扩展方向：**',
      list(idea.expansion),
      '',
      '---',
      '',
    ]),
  ]

  return `${lines.join('\n').trim()}\n`
}
