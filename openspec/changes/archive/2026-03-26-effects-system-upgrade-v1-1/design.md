## Context
V1.1 transitions Skape Ambient from simpler gradient modes into a procedural material stack with explicit base/overlay layering. This is a refactor + capability upgrade, not a product rewrite.

## Goals / Non-Goals
- Goals:
  - Standardize base effects to `flow|burn|gas`.
  - Add configurable overlay material treatments.
  - Keep presets as the contract between creator tool and public component.
  - Preserve public Framer API simplicity.
- Non-Goals:
  - Expose overlay controls directly in Framer.
  - Introduce new features not listed in `SPEC_V1_1.md`.

## Decisions
- Use two-stage shader architecture: base field first, overlays second.
- Model overlays as optional preset sub-objects.
- Keep creator-tool as full-control internal interface.
- Keep public component controlled only by preset selection.

## Risks / Edge Cases
- Overlay stacking can cause visual over-processing or reduced readability.
- Chromatic aberration and pixel-grid overlays can increase sampling cost.
- Legacy presets with removed base effect require deterministic migration strategy.
- Overlay ordering inconsistencies can produce non-reproducible visuals.

## Validation Strategy
- Per-effect visual baselines (flow/burn/gas).
- Overlay combination sanity checks with recommended active-overlay limits.
- Performance checks for fbm iteration cap and shader loop safety.
- Preset schema conformance checks for import/export.
