# Personal Idea Workbench 执行计划

## 0. 目标

将 `sketches/012-personal-llm-workbench/index_5.html` 对应的最终方向，落实为一个可长期迭代的个人外脑系统。

当前产品最终心智模型收敛为：

```text
Local-first Kanban + Spatial Detail View + AI Augmentation
```

并在此基础上补齐：

- 更高的空间利用率
- 更稳定的操作逻辑
- 全屏极简登录页
- 简单单用户鉴权系统
- 面向公网暴露的 Agent API
- SQLite + 文件目录存储
- Docker / VPS 私有部署

## 1. 已确认设计原则

### 1.1 视觉原则

- 保留 `index_5.html` 的暗黑极客风。
- 保留 `--bg: #030305`、`--surface`、`--accent: #c084fc` 等 token。
- 保留 sidebar / topbar 的 `backdrop-filter`。
- 保留 detail overlay 打开时 workspace `scale(0.96)` + 变暗。
- 保留 AI shimmer block。
- 保留卡片 `user-select: none` 的实体拖拽感。

### 1.2 交互原则

- 左侧 `Inbox / Pipeline / Trash` 是过滤器，不是独立页面切换。
- detail overlay 是前景状态，不应被左侧 filter 切换主动关闭。
- 浏览器返回 / 鼠标侧键在 detail 打开时，应优先关闭 detail，而不是直接退出页面。
- `Save Changes` 只保存，不主动关闭 detail。
- `Back` 只关闭 detail。
- `Discard` 移入 Trash 并关闭 detail。

### 1.3 架构原则

- 单用户系统，不做完整账户体系。
- Web UI 登录使用环境变量中的 password 或 token。
- Agent / CLI 使用 Bearer token。
- LLM 只负责补全选中的 idea，不负责自动选题或自动移动卡片。
- 面向公网暴露时，所有写接口和文件接口必须鉴权。

## 2. 当前状态

当前已完成：

- React 主界面迁移
- Zustand 本地状态
- dnd-kit 拖拽
- Lucide React 图标
- localStorage 持久化
- Express + SQLite 轻后端
- Bearer token 中间件
- LLM completion endpoint fallback
- Docker 生产部署
- Docker 热重载开发容器

当前主要缺口：

1. 右侧 workspace 空间利用率不足。
2. detail 页面仍然偏窄，信息层级不够饱满。
3. 左侧 filter 和 detail 的关系还不合理。
4. 缺少 Settings 页面骨架。
5. 缺少正式登录页与 session auth。
6. 数据库模型还太薄，无法支持 files / events / agent。
7. Agent API 还未版本化，也没有 schema/context 描述。

## 3. 最终信息架构

### 3.1 顶层页面

系统需要有三个顶层 UI 状态：

```text
LOGIN
WORKBENCH
SETTINGS
```

其中：

- `LOGIN`：全屏极简登录页
- `WORKBENCH`：主工作台
- `SETTINGS`：设置页面

detail overlay 不是顶层页面，而是 `WORKBENCH` 上方的前景状态。

### 3.2 WORKBENCH 结构

```text
Sidebar (fixed)
Workspace
  Topbar
  Board Area
  Optional Inspector Rail
  Detail Overlay (foreground)
```

### 3.3 Sidebar 结构

```text
Brand

Views
- Inbox
- Pipeline
- Trash

Tags
- personal-os
- tooling
- ...

System
- Settings
```

### 3.4 Detail Overlay 结构

detail 需要由单栏文档改成双栏：

```text
Main Editor (1fr)
Context Rail (320-380px)
```

左栏：

- title
- summary
- why now
- scratchpad
- file list / export block

右栏：

- AI completion
- notes / checklist
- metadata
- agent actions
- storage / sync status

## 4. 数据模型设计

### 4.1 Workbench 前端模型

建议扩展为：

```ts
type IdeaStatus = 'INBOX' | 'PIPELINE' | 'TRASH'

type IdeaSource = 'local' | 'agent' | 'import' | 'llm'

type AiAnalysis = {
  mvpSuggestion: string
  risks: string[]
  firstActions: string[]
  boundaryNotes: string
}

type WorkbenchIdea = {
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
```

### 4.2 Store 全局状态

```ts
type WorkspaceScreen = 'WORKBENCH' | 'SETTINGS'
type AuthState = 'unknown' | 'authenticated' | 'anonymous'
type SyncMode = 'local' | 'remote' | 'offline-fallback'

type AppStore = {
  authState: AuthState
  syncMode: SyncMode
  screen: WorkspaceScreen
  activeFilter: IdeaStatus
  ideas: WorkbenchIdea[]
  selectedIdeaId: string | null
  detailOpen: boolean
  statusMessage: string
}
```

## 5. 后端数据库设计

### 5.1 ideas

```text
id TEXT PRIMARY KEY
title TEXT NOT NULL
summary TEXT NOT NULL
status TEXT NOT NULL
priority TEXT
source TEXT NOT NULL
tags_json TEXT NOT NULL
why_now TEXT NOT NULL
mvp_scope TEXT
first_action TEXT
scratchpad TEXT NOT NULL
ai_enriched INTEGER NOT NULL
ai_analysis_json TEXT
sort_order REAL NOT NULL DEFAULT 0
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
archived_at TEXT
```

### 5.2 idea_events

```text
id TEXT PRIMARY KEY
idea_id TEXT NOT NULL
type TEXT NOT NULL
actor TEXT NOT NULL
payload_json TEXT
created_at TEXT NOT NULL
```

事件类型示例：

- `created`
- `updated`
- `moved`
- `completed_by_llm`
- `exported`
- `agent_read`
- `agent_pack_generated`

### 5.3 ai_completions

```text
id TEXT PRIMARY KEY
idea_id TEXT NOT NULL
provider TEXT
model TEXT
prompt_hash TEXT
input_json TEXT NOT NULL
output_json TEXT NOT NULL
status TEXT NOT NULL
error TEXT
created_at TEXT NOT NULL
```

### 5.4 files

```text
id TEXT PRIMARY KEY
idea_id TEXT
kind TEXT NOT NULL
filename TEXT NOT NULL
mime_type TEXT
size_bytes INTEGER
storage_key TEXT NOT NULL
sha256 TEXT
created_at TEXT NOT NULL
```

### 5.5 settings

```text
key TEXT PRIMARY KEY
value_json TEXT NOT NULL
updated_at TEXT NOT NULL
```

## 6. 文件存储设计

不要把文件本体塞进 SQLite。

推荐目录：

```text
/data
  idea-pool.db
  files/
    <idea-id>/
      <file-id>-agent-pack.md
      <file-id>-notes-export.md
      <file-id>-attachment.png
```

文件类型：

- `attachment`
- `export`
- `agent_pack`
- `markdown`
- `image`

所有文件下载必须走鉴权接口。

## 7. 登录与鉴权设计

### 7.1 环境变量

```text
IDEA_POOL_AUTH_ENABLED=true
IDEA_POOL_PASSWORD=your-password
IDEA_POOL_TOKEN=your-agent-token
IDEA_POOL_SESSION_SECRET=long-random-secret
```

### 7.2 鉴权模式

- Web UI：password 登录 -> HttpOnly session cookie
- Agent API：Bearer token

### 7.3 必需接口

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/session
```

### 7.4 中间件

- `requireSessionOrToken`
- `requireAgentToken`

### 7.5 生产规则

生产环境下如果开启 auth，但没有配置 password/token，应拒绝启动。

## 8. Agent API 设计

统一前缀：

```text
/api/agent/v1
```

### 8.1 核心接口

```text
GET  /api/agent/v1/context
GET  /api/agent/v1/schema
GET  /api/agent/v1/ideas
GET  /api/agent/v1/ideas/:id
POST /api/agent/v1/ideas
PATCH /api/agent/v1/ideas/:id
POST /api/agent/v1/ideas/:id/events
POST /api/agent/v1/ideas/:id/complete
POST /api/agent/v1/ideas/:id/agent-pack
GET  /api/agent/v1/ideas/:id/files
POST /api/agent/v1/ideas/:id/files
```

### 8.2 context 响应内容

应返回：

- workspace 名称
- 状态枚举
- 当前规则
- 能力说明
- auth mode

## 9. 设置页面设计

Settings 第一版先做结构，不做复杂编辑。

### 9.1 Sections

1. General
2. AI
3. Agent API
4. Storage
5. Security

### 9.2 第一版只展示

- 当前 workspace 状态
- 当前 provider/model
- 当前存储路径
- 当前 auth mode
- agent endpoint 摘要

不直接在前端编辑服务端 secret。

## 10. 交互修正规则

### 10.1 Filter 行为

- 左侧 `Inbox / Pipeline / Trash` 只更新 `activeFilter`
- 不关闭 detail
- 不清空 `selectedIdeaId`

### 10.2 浏览器返回

- 打开 detail 时 push 一条 history state
- `popstate` 时若 detail 打开，则优先关闭 detail
- 只有 detail 已关闭时才执行正常后退

### 10.3 键盘行为

- `Escape` -> 关闭 detail
- `Cmd/Ctrl+S` -> 保存当前 idea
- `Cmd/Ctrl+N` -> 新建 seed

## 11. 可执行任务包

### 执行包 1：布局与空间利用率优化

目标：让 workspace 和 detail 更饱满，避免单薄页面。

涉及文件：

- `src/App.tsx`
- `src/App.css`
- `src/store/useIdeaStore.ts`
- `src/workbenchTypes.ts`

任务：

1. sidebar 从“页面切换”语义改为“过滤器”语义。
2. board 默认始终展示多列。
3. 当前 filter 对应列放大，其他列弱化但保留。
4. 增加右侧 inspector rail 占位。
5. detail 改成双栏结构。
6. 每列高度占满剩余视口，列内滚动。

验收：

- 1280px 下 board 不再显得空。
- detail 打开后内容利用率明显提升。
- 仍保留 spatial scaling。

### 执行包 2：交互逻辑修正

目标：修复 detail 与 sidebar/back 行为冲突。

涉及文件：

- `src/App.tsx`
- `src/store/useIdeaStore.ts`
- 新增相关测试文件

任务：

1. 打开 detail 时 push history state。
2. 监听 `popstate`，先关闭 detail。
3. sidebar 切 filter 时不关闭 detail。
4. `Save Changes` 不关闭 detail。
5. `Back` 关闭 detail。
6. `Discard` -> Trash + close。

验收：

- 鼠标侧键优先关闭 detail。
- sidebar 切换不导致 detail 退出。

### 执行包 3：Settings 页面骨架

目标：引入 `SETTINGS` screen。

涉及文件：

- `src/App.tsx`
- `src/App.css`
- `src/store/useIdeaStore.ts`
- 可能新增 `src/components/SettingsView.tsx`

任务：

1. sidebar 增加 Settings 入口。
2. 新增 Settings 页面布局。
3. 加入 General / AI / Agent API / Storage / Security sections。
4. 展示当前状态，不编辑 secrets。

### 执行包 4：登录与 session 鉴权

目标：加入全屏极简登录页。

涉及文件：

- `server/auth.ts`
- `server/index.ts`
- 新增 auth/session 工具文件
- 前端新增登录页/登录态 store

任务：

1. `POST /api/auth/login`
2. `POST /api/auth/logout`
3. `GET /api/auth/session`
4. cookie session middleware
5. 前端未登录时显示全屏登录页

### 执行包 5：数据库扩展

目标：支持 events / completions / files / settings。

涉及文件：

- `server/db.ts`
- `server/types.ts`
- 新增 DB 测试

任务：

1. 扩展 `ideas` 表
2. 增加 `idea_events`
3. 增加 `ai_completions`
4. 增加 `files`
5. 增加 `settings`
6. 为拖拽顺序加入 `sort_order`

### 执行包 6：Agent API 与文件系统

目标：让公网 agent 可以安全对接。

涉及文件：

- `server/index.ts`
- 新增 agent route / file route / storage 工具
- 新增 `docs/agent-api.md`

任务：

1. 增加 `/api/agent/v1/context`
2. 增加 `/api/agent/v1/schema`
3. 增加 agent idea CRUD
4. 增加 agent completion / agent pack
5. 增加文件 metadata + 磁盘存储

## 12. 测试计划

### 12.1 前端测试

- filter 切换不关闭 detail
- detail open/close 与 history 配合正确
- Settings screen 可进入
- Save/Back/Discard 语义正确

### 12.2 后端测试

- unauthorized 请求返回 401
- login / session / logout 正常
- completion 会写 completion 记录
- file metadata 正常创建
- agent context/schema 响应稳定

### 12.3 手动验收

- `http://127.0.0.1:5173`
- 鼠标侧键 / 浏览器返回
- detail 双栏密度
- Settings 页面存在
- Docker dev / Docker prod 可启动

## 13. 当前建议的立即执行顺序

现在应先做：

1. 执行包 1：布局与空间利用率优化
2. 执行包 2：交互逻辑修正
3. 执行包 3：Settings 页面骨架

原因：

- 这些直接影响你当前的体验验收。
- 如果 UI 骨架没稳定，后面的 auth / agent / files 还会返工。
- 登录和数据库扩展应建立在稳定的页面结构之上。
