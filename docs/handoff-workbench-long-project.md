# Personal Idea Workbench Long-Project Handoff

## 1. 交接定位

这个项目现在不应该再被视为“做几个界面、补几个接口”的短任务。

它已经进入一个新的阶段：

```text
长期项目开发 / 主线产品推进
```

交接给 Hermes 时，应假设它会协调多个执行者（例如 OpenCode 与 Codex）共同推进，而不是让单个 agent 只做局部修补。

## 2. 当前结论

当前仓库虽然已经具备：

- React 前端主界面
- local-first state
- dnd-kit 拖拽
- SQLite 后端
- session/token auth groundwork
- LLM completion groundwork
- Docker dev/prod

但**当前页面设计仍然没有定稿**。

关键判断：

- 功能基础已初步成型
- 工程基础已可扩展
- 但页面设计方向仍然存在较大问题
- 因此下一阶段重点不是“继续堆功能”，而是“在高标准设计约束下推进完整产品”

## 3. 用户新增约束

这些是必须严格执行的新约束：

1. 这是一个长期开发项目。
2. 希望尽可能一次性推进完整主线。
3. 开发过程中必须严格遵循 TDD。
4. 前端设计标准必须很高。
5. 不允许修改当前整体配色风格。
6. 要保持协调、自然、克制的设计语言。
7. 这个 goal 将交给 Hermes 使用。
8. Hermes 将协调 OpenCode 与 Codex 共同开发。

## 4. 当前不应丢失的资产

### 前端资产

- `src/App.tsx`
- `src/App.css`
- `src/store/useIdeaStore.ts`
- `src/workbenchTypes.ts`
- `src/data/workbenchIdeas.ts`

### 后端资产

- `server/index.ts`
- `server/auth.ts`
- `server/db.ts`
- `server/types.ts`
- `server/llm.ts`

### 设计参考资产

- `sketches/012-personal-llm-workbench/index_5.html`
- `docs/index-5-migration-plan.md`

### 部署资产

- `Dockerfile`
- `docker-compose.yml`
- `docker-compose.dev.yml`

## 5. 当前主要问题

Hermes 必须明确：

### 5.1 视觉与布局问题仍严重

- 当前页面并不等于最终设计
- 右侧空间利用与层级仍不够成熟
- 整体结构仍有“实现了，但不够像一个成熟产品”的问题

### 5.2 架构还处于第一版

- ideas schema 刚开始扩展
- auth 刚建立基础能力
- settings 只是骨架
- agent API 还未版本化完整实现
- 文件存储系统尚未开始

### 5.3 需要从“working”推进到“product-grade”

这是关键交接意图。

## 6. Hermes 应如何理解任务

Hermes 不应把任务理解为：

- 做几次 UI patch
- 随手加几个 endpoint
- 用一个 agent 独立完成全部

Hermes 应把任务理解为：

- 长期主线推进
- 多执行者协同开发
- TDD 驱动
- 设计与架构同时推进
- 最终形成一个稳定、可部署、可远程对接 agent 的个人外脑系统

## 7. 建议 Hermes 的协调分工思路

### OpenCode 更适合

- 前端结构重构
- 样式系统与交互打磨
- 本地验证与连续迭代
- Docker/dev workflow 收敛

### Codex 更适合

- 数据库 schema 设计扩展
- API 结构化实现
- auth / file / agent endpoints
- 更大块的重构任务

但最终协调权在 Hermes，不强制固定分工。

## 8. 当前建议的总体开发主线

建议整体主线为：

1. 前端页面结构重做 / 收敛
2. 登录页与 auth 体系定型
3. settings 变成真实页面
4. DB schema 扩展
5. agent API 第一版
6. file storage 第一版
7. remote sync 稳定化
8. 文档与部署收口

## 9. 验收标准

Hermes 最终交付时，应该至少满足：

### 工程

- `npm test`
- `npm run lint`
- `npm run build`
- `npm run build:server`

### 前端

- 页面设计成熟，而不是仅“能用”
- 空间利用率合理
- detail / board / settings / login 关系清晰
- 配色风格不被破坏

### 后端

- auth 稳定
- DB 结构完整
- agent API 可调用
- Docker 可部署

## 10. 最后说明

这次 goal 的重点不是“做完一小块功能”，而是把项目推进成一个真正可以长期发展的产品基础。

如果需要在实现过程中重构当前页面结构，这是被鼓励的；但不要破坏产品心智模型与已经可用的工程基础。
