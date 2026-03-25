## 1. Shader Refactor
- [x] 1.1 Replace old base-effect selection with `flow | burn | gas` only.
- [x] 1.2 Remove `liquid` base-effect branch and redundant gradient mode branches.
- [x] 1.3 Update `flow` and `burn` implementations to the v1.1 definitions.
- [x] 1.4 Add `gas` base effect with directional stretching, domain warping, and optional banding.
- [x] 1.5 Split shader pipeline into base-generation and overlay-application stages.

## 2. Overlay Implementation
- [x] 2.1 Keep `liquidGlass` as overlay-only polish layer.
- [x] 2.2 Add `ribbedGlass` overlay with intensity/frequency/angle/mode behavior.
- [x] 2.3 Add `chromaticAberration` overlay with intensity/offset/mode behavior.
- [x] 2.4 Add `pixelGrid` overlay with size and line-strength behavior.
- [x] 2.5 Ensure overlay order and compositing follow the v1.1 pipeline model.

## 3. Preset Migration
- [x] 3.1 Update preset schema/types to include `effect: flow|burn|gas` and optional `overlays`.
- [ ] 3.2 Migrate/regenerate presets that used removed base effect(s).
- [x] 3.3 Validate imported/exported preset JSON against updated schema.

## 4. Creator Tool Update
- [x] 4.1 Update base effect UI to `flow | burn | gas` only.
- [x] 4.2 Add overlay toggles and controls for each overlay type.
- [x] 4.3 Remove deprecated controls tied to removed base/gradient behaviors.
- [x] 4.4 Keep UX clean by separating base controls and overlay controls.

## 5. Validation
- [ ] 5.1 Confirm visual output quality for each base effect.
- [ ] 5.2 Confirm overlay combinations remain performant under constraints.
- [ ] 5.3 Confirm Framer-facing API remains preset-only (`preset: string`).
- [ ] 5.4 Confirm no nested-loop regressions and fbm iteration limit compliance.
