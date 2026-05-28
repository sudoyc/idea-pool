# 个人项目灵感池 Agent：产品说明

## 定位

个人项目灵感池 Agent 是一个本地优先的 vibe coding 启动器。它不试图一开始成为完整项目管理系统，而是帮用户从“我想做点什么”快速落到“现在可以开工的 3-10 个小项目”。

## 用户场景

用户打开页面时通常处在这些状态：

- 想 vibe coding，但没有明确方向。
- 有很多项目碎片，但不知道哪个最适合现在做。
- 想在今晚/周末做一个可跑起来的 MVP。
- 想把 idea 继续转成 Agent Pack、计划或代码任务。

## v1 原则

- Local-first：不需要账号、不需要数据库、不需要后端。
- Fast feedback：输入后立刻生成卡片。
- Small scope：只做“生成项目卡片”一个核心动作。
- Actionable：每张卡片必须包含第一步，而不是泛泛而谈。
- Extensible：输出结构后续能导出 markdown、Agent Pack、任务计划。

## v1 输入

- 当前心情/方向：例如“想做 agent 工具”“想做视觉强的东西”“想解决自己的 infra 麻烦”。
- 可用时间：30 分钟、2 小时、今晚、周末。
- 偏好技术栈：React、Python、CLI、Cloudflare、LLM、SQLite 等。
- 约束：本地优先、不接后端、不碰登录、要视觉反馈、要能交给 agent 等。
- 输出数量：默认 6 个。

## v1 输出卡片

每个 idea card 包含：

- 标题
- 分类
- 一句话简介
- 为什么适合现在做
- MVP 范围
- 首个 30 分钟动作
- 推荐技术栈
- 扩展方向
- 评分：自用性、反馈速度、范围清晰、可扩展性

## v1 非目标

- 不做账号系统。
- 不做云同步。
- 不自动修改其它项目文件。
- 不一开始接 GitHub/Obsidian/session_search。
- 不把 idea 变成完整 PM 工具。

## v2 方向

- OpenAI-compatible API：从模板生成升级为 LLM 生成。
- 本地项目扫描：读取 ~/projects 的 repo 名、README、package.json，避免重复 idea。
- 导出 Agent Pack：一键把 idea 转成 coding agent 任务包。
- 导出 implementation plan：生成 docs/plans/YYYY-MM-DD-xxx.md。
- 周期性推荐：每天/每周根据最近工作状态推荐 3 个 idea。

## 推荐项目名

暂用名：Project Idea Pool

其它可选名：

- Sparkbench
- NextThing
- Idea Dock
- Build Seeds
- Vibe Queue

注意：正式命名时避免使用用户 handle。
