# Change: Visual System Update V1.3

## Why
`SPEC_v1_3.md` upgrades the current shader and preset model into a more distinct visual system with structured base effects, texture-driven overlays, and always-on grain identity. Existing specs still reflect the prior overlay model (`liquidGlass`/`ribbedGlass`) and older effect set.

## What Changes
- Expand base effect set to `flow | gas | burn | bands | cellular`.
- Add explicit noise-system requirements (`simplex`, `fbm`, `worley`, optional `value`) with fbm iteration cap.
- Replace legacy overlays (`liquidGlass`, procedural `ribbedGlass`) with `textureOverlay`, while retaining `chromaticAberration` and `pixelGrid`.
- Add a texture library contract and texture-overlay sampling behavior.
- Add always-on grain requirement with global intensity range.
- Update preset schema requirements to reflect v1.3 effect/overlay structure.
- Update creator-tool controls for new effect set, texture overlay controls, and grain intensity control.

## Impact
- Affected specs: `effects-system`, `creator-tool`
- Affected code:
  - shader effect branches and overlay composition logic
  - noise utility implementation and grain pass
  - preset types/validation/import/export
  - creator tool control panels for effects, overlays, and grain
