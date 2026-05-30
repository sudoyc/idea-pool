# 015 Single Idea Pool + Drag Classification Sketches

这轮基于新的产品判断：主视图不再用三个状态栏位表达 idea 的工作状况。主视图只负责呈现 idea pool，也就是许多卡片；状态分类在拖拽时才从右侧弹出两个 drop windows。

图片中框出来的左侧区域，在这些方案里被用于调整主视图内容：lens / density / sort，而不是在主区占用三栏状态。

| Variant | 主视图 | 左侧框选区用途 | 拖拽分类 | 强项 | 风险 |
|---|---|---|---|---|---|
| Lens Grid Pool | 自适应卡片网格 | Pool lenses | 右侧 Active / Parked 两窗口 | 最平衡，最适合作为生产基线 | 大量卡片需要搜索/排序继续增强 |
| Dense Index Pool | 密集索引卡片 | Main view filters | 右侧 Active / Parked 两窗口 | 信息密度最高 | 可能略工具化、空间感较弱 |
| Masonry Pool Wall | 瀑布流卡片墙 | Lens / density / sort | 右侧 Active / Parked 两窗口 | 最像个人外脑的空间池 | DnD 实现复杂度最高 |

## My take

推荐从 **Lens Grid Pool** 进入生产实现：

1. 它最准确地落实“主视图专注 idea pool”。
2. 它保留原 app shell 和暗色工具气质。
3. 它不会用三栏状态挤压主内容。
4. 拖拽时右侧弹出分类窗口，符合你提出的新交互模型。

后续可以把 Dense Index 的密度切换作为一个 view option，把 Masonry 作为将来的 spatial mode，而不是第一版主线。
