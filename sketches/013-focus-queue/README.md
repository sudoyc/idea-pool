## Variant: Focus Queue

### Design stance
Kanban remains a status model, but the daily work surface is one focused queue rather than three permanent vertical lanes.

### Key choices
- Layout: top command bar + status segmented control + one central queue + bottom focused detail sheet.
- Typography: same developer-tool mono labels and compact body rhythm as the current UI.
- Color: current dark background, muted surfaces, purple accent, green sync state.
- Interaction: status filter, card selection, bottom detail sheet open/close with slide motion.

### Trade-offs
- Strong at: reducing visual noise, making the next idea obvious, preserving local-first confidence.
- Weak at: less immediate cross-column drag affordance than a classic Kanban board.

### Best for
- A private workbench where the main loop is capture → pick one idea → write/augment/handoff.
