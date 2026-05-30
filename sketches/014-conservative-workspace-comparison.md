# 014 Conservative Workspace Layout Sketches

这组三个 sketch 的边界：保留 Personal Idea Workbench 原本 app shell，不重做成新的产品形态；只调整 workspace 主区的 board / context / inspector 关系。

| Variant | 改动幅度 | 主区结构 | 右侧 rail | 强项 | 风险 |
|---|---:|---|---|---|---|
| Board-first Conservative | 低 | 三列 board 全宽 | 删除 | 最接近当前实现，修复空间浪费最快 | 三列仍等权，focus 不够强 |
| Focused Kanban | 中 | 当前关注列更宽，其它列降权 | 删除 | 保留 Kanban，同时建立主次和阅读节奏 | DnD/响应式实现要细 |
| Context Strip Kanban | 中低 | 顶部薄 context strip + 三列 board | 合并为顶部 strip | 保留必要状态，不浪费 340px | strip 内容容易失控 |

## My take

如果目标是“不要推翻原整体布局，但工作区要成熟”，我推荐先以 **Focused Kanban** 为主线，再从 **Context Strip** 借一点极薄状态条思路。

更保守的落地顺序：

1. 先实现 Board-first Conservative：删除/折叠 InspectorRail，board 占满主区。
2. 再在测试保护下加入 Focused Kanban 的列宽主次。
3. 最后只在必要时加入 Context Strip，不要让它变成新的 filler rail。
