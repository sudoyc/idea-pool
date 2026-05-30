## Variant: Board-first Conservative

### Design stance
保留当前 app shell 和三列 Kanban，只删除/折叠低价值右侧 rail，让 board 重新成为主区。

### Key choices
- Layout: sidebar + topbar 不变；workspace 主区全宽三列 board。
- Typography: 沿用当前 mono section label + Inter 正文节奏。
- Color: 沿用现有暗色、紫色 accent，不加新视觉噪音。
- Interaction: 点击卡片打开原有 focused detail drawer；Escape/Back 关闭。

### Trade-offs
- Strong at: 改动最小，最快修复空间利用问题。
- Weak at: 三列仍然等权，focus 感提升有限。

### Best for
想先把当前生产布局修到可接受，同时不引入新交互模型的保守实现。
