## Variant: Lens Grid Pool

### Design stance
主视图就是一个统一 idea pool：大量卡片网格；图片中框出来的 sidebar 区域变成 Pool lenses，用来调整主视图显示内容。

### Key choices
- Layout: 原 app shell 保留；主区不再三栏，而是自适应 card grid。
- Typography: 卡片密度中等，适合持续浏览。
- Color: 沿用当前暗色/紫色 token。
- Interaction: 左侧 lens 过滤 All / Unsorted / Active / Parked；拖拽卡片时右侧滑出 Active work 与 Parked 两个分类窗口。

### Trade-offs
- Strong at: 最清楚表达“主视图专注 idea pool”。
- Weak at: 对大量卡片时可能需要更强搜索/排序。

### Best for
作为生产实现的基准方案。
