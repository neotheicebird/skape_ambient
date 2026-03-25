# Change: Effects System Upgrade V1.1

## Why
`SPEC_V1_1.md` upgrades Skape Ambient from a simple gradient system to a procedural base-effect system with layered overlays. This change captures the scoped refactor and capability upgrade for shader architecture, presets, and creator-tool controls.

## What Changes
- Upgrade base effects to `flow | burn | gas`.
- Remove deprecated `liquid` base effect and redundant gradient modes.
- Introduce overlay effect system (`liquidGlass`, `ribbedGlass`, `chromaticAberration`, `pixelGrid`).
- Refactor shader pipeline to `BaseEffect -> OverlayEffects`.
- Extend preset schema with optional `overlays` configuration.
- Update creator tool controls for new base/overlay model.
- Keep Framer public API preset-driven (`preset: string`) with no overlay controls.
- Apply updated performance constraints for shader complexity and overlay usage.

## Change Summary

### A. Base Effect Changes
- Removed:
  - `liquid` as a base effect
  - redundant gradient modes
- Added:
  - `gas` base effect
- Modified:
  - Base effect set is now exactly `flow | burn | gas`
  - `flow` clarified as domain-warped fbm, smooth motion, low contrast
  - `burn` clarified as thresholded fbm with animated edges and optional glow

### B. Shader Changes
- Pipeline update:
  - Two-stage architecture: `BaseEffect -> OverlayEffects`
- New/explicit techniques:
  - fbm
  - domain warping
  - thresholded fields
  - directional stretching (for gas)
  - optional banding (for gas)
  - UV quantization and channel offsets for overlays
- Structural refactor:
  - Base field generation separated from post/base-color overlays

### C. Overlay System
- New overlay types:
  - `ribbedGlass`
  - `chromaticAberration`
  - `pixelGrid`
- Existing overlay retained:
  - `liquidGlass` (as overlay, not base effect)
- Purpose:
  - appearance/material treatment layered on base field result
- Pipeline position:
  - applied in overlay stage after base effect structure/motion

### D. Preset System Changes
- Schema updates:
  - `effect` enum changed to `flow | burn | gas`
  - optional `overlays` object with typed overlay configs
- Backward compatibility:
  - legacy presets using removed `liquid` base effect require migration/regeneration

### E. Creator Tool Changes
- New controls:
  - base effect selector: `flow | burn | gas`
  - overlay toggles and controls for all defined overlays
- Removed controls:
  - deprecated base effect path for `liquid` base effect
  - controls tied only to removed gradient modes
- UI changes:
  - layered controls model: base effect section + overlay section

### F. Performance Constraints
- fbm iterations: max 4
- active overlays: 2–3 recommended
- chromatic aberration: optional per preset
- avoid nested loops in shader

## Impact
- Affected specs: `effects-system` (new capability)
- Affected code:
  - shader field-generation and compositing pipeline
  - overlay shader modules/uniforms
  - preset schema/types and preset library content
  - creator-tool controls and UX flow
