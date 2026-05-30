## Variant: Context Strip Kanban

### Design stance
不保留右侧 inspector rail，但把必要状态压缩成主区顶部一条薄 context strip。

### Key choices
- Layout: sidebar + topbar 不变；workspace = context strip + full-width board。
- Typography: context strip 使用小标题和一行摘要，避免变成新 dashboard。
- Color: 低对比 surface，不抢 board 的主视觉。
- Interaction: 点击卡片打开 detail drawer；selected idea 名称同步到 context strip。

### Trade-offs
- Strong at: 保留系统状态感，同时避免 340px 右 rail 浪费空间。
- Weak at: 如果后续塞太多内容，strip 也可能变成噪音。

### Best for
需要保留 sync/selection/agent 状态可见性，但不想牺牲 board 宽度的版本。
