## Variant: Personal LLM Workbench

### Design stance

基于 `010-gemini-workbench-notes` 继续收敛：这是一个个人项目工作台，不是 SaaS，不做重账户系统。LLM 只负责补全已有 idea，不负责自动选题。

### Key layout choices

三栏结构：左侧本地 brief、部署/鉴权/LLM 状态和 idea/session 列表；中间是可阅读的 idea 文档和 LLM completion diff；右侧保留 notes/checklist，并加入后端形态与 Docker/VPS 部署提示。

### Typography choices

继续沿用 Gemini 3 的 zinc 暗色、细边框、克制紫色 active state。中间文档保持 34-44px 标题、15.5-16px 正文、较大行高。右侧保持 12-13px 的工具栏密度。

### Interactions

选择 idea、点击 Local rank toast、点击 Complete with LLM 只补全当前 idea、右侧 checklist 可勾选、文档内 Complete 可切换 completion 状态。

### Architecture stance

推荐轻后端：React 前端 + 一个小 API server + SQLite + 简单 token 鉴权 + Docker 部署。LLM API key 只存在服务端。

核心 API 可以先只有：

```text
POST /api/ideas/:id/complete
```

请求内容是已有 idea、当前 brief、用户 notes。返回结构化 JSON：`whyNow`、`mvpScope`、`firstAction`、`risks`、`suggestedChecklist`。

### Strong at

把 AI 生成和用户判断分层；保留个人项目的轻量复杂度；自然支持远程 VPS 私有部署。

### Weak at

还没有展示完整 session history、SQLite 数据浏览、Agent Pack 导出细节。

### Best for

下一版产品设计与架构讨论的主候选。
