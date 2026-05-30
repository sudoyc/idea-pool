## Variant: Dense Index Pool

### Design stance
把主视图当成个人 idea index：更密、更快扫，不用三栏状态表达工作阶段。

### Key choices
- Layout: 双列/三列混合密集索引，重点卡片略宽。
- Typography: 标题更紧凑，摘要压缩到两行。
- Color: 无新装饰，只靠层级和密度。
- Interaction: 左侧 framed controls 调整 lens/density/sort；拖拽时右侧出现两个 drop windows。

### Trade-offs
- Strong at: 卡片多时信息密度最好。
- Weak at: 空间记忆弱于 Masonry，阅读舒适度弱于 Lens Grid。

### Best for
idea 数量很多、偏 power-user 的日常整理。
