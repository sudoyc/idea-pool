# Sketch 013 Layout Redesign Comparison

Goal: remove the current three-vertical-column / right-inspector-rail structure while preserving the existing dark, purple-accent, developer-tool visual language and restrained animation feel.

## Variants

| Variant | File | Layout stance | Best fit | Main risk |
|---|---|---|---|---|
| Focus Queue | `sketches/013-focus-queue/index.html` | One active queue + status segmented control + bottom focused detail sheet | Fast capture and daily triage | Less spatial than classic Kanban |
| Two-pane Workbench | `sketches/013-two-pane-workbench/index.html` | Compact idea index + full selected idea document | Durable writing/editing/agent handoff | Kanban becomes filter/action rather than visible board |
| Canvas Board | `sketches/013-canvas-board/index.html` | Spatial canvas + status docks + bottom detail shelf | Spatial memory and idea clustering | More implementation complexity |

## My current read

Two-pane Workbench is the safest product-mainline direction because it removes filler rails, gives selected idea detail the correct weight, and keeps AI/files/metadata contextual inside the document.

Focus Queue is the best low-risk simplification if we want the smallest conceptual jump from the current app.

Canvas Board is the most aligned with “Spatial Detail View”, but should probably be a later iteration after drag/zoom/selection behavior is specified carefully.
