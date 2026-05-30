## Variant: Canvas Board

### Design stance
Use spatial proximity instead of vertical columns: ideas live on a dark canvas with status docks and a contextual detail shelf.

### Key choices
- Layout: full canvas with positioned cards, lightweight status docks, bottom detail shelf.
- Typography: compact card titles and mono cluster labels to keep developer-tool feel.
- Color: same dark/purple base, subtle grid, no decorative metrics.
- Interaction: card selection, shelf hide/show, focus-cluster zoom toggle, status dock active state.

### Trade-offs
- Strong at: matching the “spatial detail view” mental model and making idea relationships visible.
- Weak at: more complex to implement well; needs careful drag/zoom behavior to stay durable.

### Best for
- A future iteration after the core workbench loop is stable, especially if clustering and spatial memory matter.
