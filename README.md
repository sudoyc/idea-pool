# 个人项目灵感池 Agent

一个本地优先的 vibe coding 启动器：输入当前心情/方向、可用时间、偏好技术栈和约束，生成一组可执行的项目卡片。

当前版本是无后端 MVP：所有推荐都基于 `src/data/seedIdeas.ts` 的 21 个 seed ideas 和本地 deterministic 排序规则完成，不依赖 LLM API。

## 功能

- 21 个已记录的项目 idea，按 P0/P1/P2 管理
- 本地表单输入：方向、时间、技术栈、约束、输出数量
- 自动推荐项目卡片：MVP、首个 30 分钟动作、技术栈、扩展方向
- 一键复制或下载 Markdown 推荐结果
- 文档入口：灵感池、产品说明、实施计划

## 本地运行

```bash
npm install
npm run dev
```

默认访问：`http://127.0.0.1:5173/`

## 校验

```bash
npm test
npm run lint
npm run build
```

## 主要路径

- `docs/idea-pool.md`：完整 21 个项目 idea 灵感池
- `docs/product-brief.md`：产品说明
- `docs/implementation-plan.md`：实施计划
- `src/data/seedIdeas.ts`：前端推荐使用的 seed 数据
- `src/generator.ts`：本地推荐排序逻辑
- `src/markdown.ts`：Markdown 导出逻辑
- `src/components/IdeaCard.tsx`：项目卡片组件
