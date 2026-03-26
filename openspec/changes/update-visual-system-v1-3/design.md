## Context
V1.3 pivots the visual language from mostly procedural distortion overlays toward structured effects plus lightweight texture materials. This updates both rendering architecture and creator-tool authoring controls.

## Goals / Non-Goals
- Goals:
  - Increase visual distinction between presets while keeping runtime lightweight.
  - Remove weak/redundant overlay behaviors and replace with texture-based material controls.
  - Establish always-on grain as a consistent identity layer.
- Non-Goals:
  - Device-adaptive quality switching.
  - New public Framer controls beyond preset-driven usage.
  - Expanding texture pipeline into dynamic external CDN loading in v1.3.

## Decisions
- Decision: Keep the two-stage pipeline (`BaseEffect -> OverlayEffects`) and add grain as a final always-on pass.
  - Rationale: Preserves architecture continuity while introducing v1.3 visual identity.
- Decision: Replace `liquidGlass` and procedural `ribbedGlass` with a single `textureOverlay`.
  - Rationale: Improves consistency and art direction with simpler runtime behavior.
- Decision: Add base effects `bands` and `cellular` as first-class effect modes.
  - Rationale: Enables structured stripe and organic-cell styles requested in spec.
- Decision: Maintain prior performance guardrails (fbm <= 4, recommended overlays <= 2) while remapping budget scoring to the v1.3 overlay set.
  - Rationale: Keeps v1.2 performance model aligned with v1.3 feature set.

## Risks / Trade-offs
- Texture tiling artifacts can reduce quality if assets are not seamless.
  - Mitigation: enforce grayscale/seamless texture constraints and controlled texture sizes.
- Additional effect branches may increase shader complexity.
  - Mitigation: maintain fbm caps and keep overlay stack guidance advisory but visible.
- Grain always-on can over-soften output if overtuned.
  - Mitigation: constrain grain intensity to a narrow global range.

## Migration Plan
1. Update specs and types for v1.3 effect and overlay model.
2. Implement shader updates (`bands`, `cellular`, texture overlay, grain pass).
3. Remove deprecated overlay controls and add texture/grain controls in creator tool.
4. Keep import compatibility where feasible; provide migration warnings for deprecated fields.

## Open Questions
- None for proposal scope.
