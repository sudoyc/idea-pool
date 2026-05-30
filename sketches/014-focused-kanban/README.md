## Variant: Focused Kanban

### Design stance
仍然是原来的 Kanban 工作台，但当前关注状态列更宽、更亮，其它列降权作为上下文。

### Key choices
- Layout: sidebar + topbar 不变；board 三列仍在同一层，但列宽根据左侧 view 切换。
- Typography: 保留当前 column/card 结构，只增强 active column 的标题和边界。
- Color: 仅使用现有 accent 与 line token。
- Interaction: 点击左侧 Inbox/Developing/Archived 改变主列宽度；点击卡片打开 detail drawer。

### Trade-offs
- Strong at: 保留 Kanban，同时解决三等分无主次的问题。
- Weak at: drag/drop 和窄屏响应式需要更认真实现。

### Best for
长期作为主线：既保留原产品心智，又让工作区有明确阅读重心。
