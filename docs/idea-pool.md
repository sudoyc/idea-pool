# Vibe Coding 项目灵感池

> 目的：把当前想到的项目 idea 集中记录，优先推进“个人项目灵感池 Agent”。

## 优先级说明

- P0：优先做，能直接解决当前问题，且 MVP 小。
- P1：很适合后续做，和现有工作流关系强。
- P2：视觉/趣味/内容方向，适合 vibe coding 或作品集。

## P0：优先项目

### 1. 个人项目灵感池 Agent

一句话：一个本地优先的小工具，输入“我想做点什么/我现在有什么资源”，自动生成一组可执行的项目卡片。

核心价值：
- 直接解决“想 vibe coding 但不知道做什么”的问题。
- 以后可以接 GitHub、Obsidian、Hermes session、已有项目目录，越用越懂你的偏好。
- 能作为其它项目的入口工具：先产出 idea，再产出 plan，再交给 agent 实现。

第一版 MVP：
- 单页 Web App。
- 输入：兴趣/心情/可用时间/技术栈/约束。
- 输出：项目卡片列表。
- 每张卡片包含：标题、简介、为什么适合现在做、MVP、首个 30 分钟动作、推荐技术栈、扩展方向。
- 不依赖后端，先用本地规则和模板生成。

后续扩展：
- 接 OpenAI-compatible API 生成更自然的 ideas。
- 读取本地项目目录，避免重复造轮子。
- 导出 Agent Pack / markdown plan。
- 每周自动生成“本周可做的 5 个项目”。

## P1：Agent / 开发工作流类

### 2. Agent Pack 生成器

输入一个项目目标，输出可复制给 Codex/OpenCode/Claude Code/Generic Agent 的结构化 Agent Pack。

包含：
- 背景
- 目标
- 约束
- 任务拆解
- 验收标准
- 验证步骤
- handoff 格式

MVP：纯前端表单 + deterministic markdown 模板 + 复制/下载。

### 3. Hermes Skill Playground

本地 UI，用来浏览、搜索、预览、创建和校验 Hermes skills。

MVP：
- 读取 skills 目录。
- 展示列表和内容。
- 新建 skill 草稿。
- 校验 YAML frontmatter。

### 4. “下一步该做什么”本地任务推荐器

扫描当前项目状态，推荐下一步最值得做的 3 件事。

输入/来源：
- git diff
- TODO/FIXME
- README
- 最近 commit
- package scripts
- 测试结果

输出：
- 推荐任务
- 风险
- 推荐执行 agent
- 是否需要先写 plan

### 5. Agent 工作流可视化器

输入 markdown 计划，自动生成 Mermaid / React Flow / 时间线 / Kanban / agent 分工图。

MVP：
- textarea 输入计划。
- LLM 或规则解析为 nodes/edges。
- Mermaid 或 React Flow 展示。

## P1：实用工具 / Infra 类

### 6. API Key / Provider 配置检查器

检查 OpenAI/OpenRouter/Hermes/vLLM/Ollama 等 provider 配置是否可用。

MVP：
- 本地 CLI。
- 读取 .env。
- 请求 /v1/models。
- 输出诊断报告：是否可用、失败原因、修复建议。

### 7. “我的服务还活着吗”小监控

配置 URL/API，定时检查，不可用时提醒，并生成状态页。

MVP：
- Node/Python 脚本。
- SQLite 保存结果。
- 简单状态页。

### 8. GitHub Repo Health Dashboard

输入 GitHub 用户名或 repo 列表，展示 repo 健康状况。

指标：
- 最近活跃度
- issue/PR 堆积
- CI 状态
- README/license 完整度
- 是否适合继续维护

### 9. 个人服务目录

给自己的服务做 dashboard，记录状态、链接、部署位置和备注。

可覆盖：
- arqel
- docs
- Hermes
- Open WebUI
- VPS 服务
- bot/bridge

## P1：个人效率 / 信息整理类

### 10. Obsidian / Markdown 自动整理器

扫描 markdown vault，找重复主题、孤立笔记、过期 TODO，生成索引页和整理建议。

MVP：只输出 report.md，不自动修改文件。

### 11. 聊天记录 → 个人知识卡片

输入聊天文本，抽取偏好、观点、项目想法、长期目标和可复用 skill。

MVP：
- 本地文件输入。
- 输出 JSON + markdown。
- 默认隐私过滤。

### 12. 每日“思路清仓”工具

输入一堆乱想法，自动分成：今天可做、以后再说、项目种子、需要查证、情绪/碎碎念。

输出一个“现在最该做哪一个”的建议。

## P2：前端 / 视觉反馈强的项目

### 13. Landing Page 盲盒生成器

输入产品一句话，生成 3 个不同风格 landing page。

风格例子：
- Linear 风
- Stripe 风
- Notion 风
- 赛博风
- 极简开发者工具风

MVP：固定 5 套风格 prompt / 模板，iframe 预览，一键下载 HTML。

### 14. README Hero 图生成器

输入项目名、tagline、颜色风格，生成 GitHub README 顶部 banner SVG/PNG。

风格例子：
- terminal 风
- 产品卡片风
- 架构风
- 像素风

### 15. 产品截图美化器

上传截图，自动加背景、阴影、浏览器壳、标题，导出社交媒体尺寸 PNG。

MVP：拖拽图片 + 模板选择 + canvas 导出。

## P2：内容生成 / 创作类

### 16. 中文长文 → 配图/信息图套件

输入文章，生成封面图 prompt、小红书/公众号配图、信息图结构和摘要卡片。

MVP：markdown 输入，输出 5 张 SVG/HTML 卡片。

### 17. 知识漫画生成器

输入一个概念，输出 4 格漫画脚本、画面说明、对话和 HTML 漫画页。

MVP：固定四格模板，文字 + SVG/emoji 占位。

### 18. YouTube/文章 → 个人学习卡

输入 URL 或文本，输出核心观点、反直觉点、行动建议、延伸项目 idea 和 Anki 卡片。

## P2：游戏 / 玩具类

### 19. AI 地牢 / 文字冒险引擎

用户输入行动，LLM 推进剧情，状态用 JSON 保存，前端像复古终端。

MVP：一个世界设定 + 地点/血量/背包/NPC 好感状态。

### 20. 项目养成游戏

把真实项目变成养成游戏。

映射：
- repo = 角色/建筑
- commit = 经验
- issue = 任务
- CI passing = buff
- 长时间没维护 = 掉血

MVP：读取本地 git repo，生成像素风 dashboard。

### 21. 本地 AI 宠物助手

桌面/网页小宠物，根据你当前任务状态说话，检测卡住状态，给下一步建议。

MVP：浏览器页面 + 手动输入当前状态 + 返回一句话和建议。

## 选题评分器

每个 idea 0-2 分：

- 我自己会用吗？
- 今晚能看到结果吗？
- 是否可以只做一个核心动作？
- 是否能复用已有经验？
- 做完后能否继续长大？
- 是否有视觉/自动化反馈？

总分 8 分以上就可以开工。
