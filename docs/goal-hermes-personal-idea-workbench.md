# /goal for Hermes

你要负责推进一个**长期、完整、可持续迭代的产品开发任务**，而不是一次性的页面修补。

项目名称：`Personal Idea Workbench`

你的角色不是单纯写代码，而是：

- 作为总协调者统筹整个项目开发
- 根据任务特点协调 `OpenCode` 与 `Codex` 分工协作
- 保证最终结果是一个可以长期维护、具备真实产品结构的系统

## 一、项目目标

把当前仓库发展成一个完整的个人外脑系统，核心心智模型保持为：

```text
Local-first Kanban + Spatial Detail View + AI Augmentation
```

这个项目不是 demo，不是 landing page，不是单次原型，而是一个要长期开发、持续迭代、可以部署到个人服务器并供 agent 远程接入使用的真实产品。

你需要把工作理解为：

- 一次性推进完整产品主线
- 尽可能端到端完成
- 不停留在“只是修 UI”或“只是补后端”
- 在保证质量的前提下，把当前仓库推进到一个更完整、更稳定、更合理的状态

## 二、开发原则

### 1. 严格遵循 TDD

整个开发过程必须严格遵循 TDD：

1. 先写或先更新测试
2. 让测试失败
3. 实现最小正确改动让测试通过
4. 在测试保护下重构
5. 每个阶段都要重新跑测试、lint、build

不允许“先写一堆代码，最后再补测试”。

### 2. 高标准前端设计要求

前端设计标准必须很高。

要求：

- 不允许修改既定的整体配色风格
- 必须保持当前暗色、紫色 accent、开发者工具气质
- 设计要协调、自然、克制
- 不允许靠更多渐变、玻璃拟态、装饰性噪音掩盖结构问题
- 必须真正解决布局、层级、空间利用率、阅读节奏、信息架构问题

你应该把 UI 要求理解为：

- 这是一个私人工作台，不是 SaaS dashboard
- 这是一个长期使用的开发者工具，不是 marketing 页面
- 界面必须有“耐用性”而不是“炫技感”

### 3. 不允许弱化产品核心模型

必须保留：

- Local-first
- Kanban 式 idea 管理
- Focused detail view
- AI 只补全 selected idea
- 单用户/个人部署逻辑
- 私有、公网可控暴露的 agent 接口

### 4. 不允许只做表面修补

如果当前页面结构不合理，你应该重构它，而不是只打补丁。

## 三、Hermes 协调职责

你会协调 `OpenCode` 与 `Codex`，但你自己必须负责：

- 总体架构判断
- 任务拆分
- 顺序安排
- 验收标准
- 合并质量控制
- 防止两个子执行者做出相互冲突的结构

建议协作模式：

### OpenCode 更适合负责

- 仓库内连续实现
- 前端布局还原与组件改造
- 本地验证、修复、重构
- Docker / dev workflow / integration glue

### Codex 更适合负责

- 结构化后端实现
- 数据模型细化
- API 设计与测试
- 某些大块重构任务

但具体如何分工，由你判断。

## 四、当前项目问题

你必须视以下问题为真实且严重：

1. 当前页面设计方向仍然不够好。
2. 右侧空间利用率、层级和结构都不够成熟。
3. board / inspector / detail 的关系还不够清晰。
4. Settings 只是概念骨架，还不是完整设计。
5. auth / agent / DB / file storage 仍然只是第一层实现。
6. 当前成果更像“已经能工作”，还不像“长期产品主线已经成立”。

## 五、必须保留的技术基础

当前仓库已经有一些可复用基础，不要随意推倒重来：

- React + Vite + TypeScript
- Zustand
- dnd-kit
- Express
- SQLite (`better-sqlite3`)
- session/token auth groundwork
- LLM completion groundwork
- Docker dev/prod setup

你可以重构 UI、调整状态结构、扩展后端，但不要轻易破坏这些基础。

## 六、开发范围

你的目标不是只做 redesign，而是把项目主线推进到一个更完整的状态。

建议至少覆盖：

1. 前端工作台重构
2. detail / settings / auth 页面设计定稿
3. 认证系统完成
4. 数据库 schema 扩展
5. agent API 第一版
6. 文件存储设计与实现
7. 远程同步逻辑完善
8. Docker / VPS 方案稳定
9. 文档、交付与开发说明补齐

## 七、必须完成的系统能力

### 前端

- 更成熟的 board 布局
- 更合理的 detail 结构
- 全屏极简登录页
- Settings 页面
- 良好的浏览器返回/前进行为
- 高质量交互细节

### 后端

- session login/logout/session check
- token auth for agents
- stable idea CRUD
- idea enrichment API
- agent context + versioned agent endpoints
- file metadata and storage model

### 数据层

- ideas
- idea_events
- ai_completions
- files
- settings

### 部署

- 本地 dev container 热重载
- 生产 docker compose
- 适配个人 VPS

## 八、质量门槛

每个阶段都必须通过：

```bash
npm test
npm run lint
npm run build
npm run build:server
```

并进行浏览器验证：

- desktop 1280px
- detail open / close
- back button behavior
- auth flow
- Docker dev flow

## 九、禁止事项

不要：

- 退回 generic SaaS dashboard
- 使用 fake metrics/charts
- 靠更多视觉噪音掩盖布局问题
- 把系统做成复杂多用户 SaaS
- 让 LLM 自动决定做哪个 idea
- 跳过测试直接编码
- 忽略已有 working backend/auth/deployment 基础

## 十、推荐起始阅读顺序

先读：

1. `docs/handoff-workbench-redesign.md`
2. `docs/index-5-migration-plan.md`
3. `sketches/012-personal-llm-workbench/index_5.html`
4. `src/App.tsx`
5. `src/App.css`
6. `src/store/useIdeaStore.ts`
7. `server/index.ts`
8. `server/auth.ts`
9. `server/db.ts`

## 十一、输出要求

你最终返回时必须包含：

1. 你如何拆分 OpenCode / Codex 协作任务
2. 当前总体实施计划
3. 每个阶段的 TDD 执行情况
4. 具体修改文件列表
5. 验证结果
6. 当前剩余风险与后续建议

## 十二、核心要求总结

把这个任务当作一个**长期项目开发主线**来推进。

不是做一个“还不错的页面”，而是把它推进成一个：

- 结构合理
- 设计成熟
- 工程可靠
- 可部署
- 可对接 agent
- 可以长期继续演化

的真实个人产品。
