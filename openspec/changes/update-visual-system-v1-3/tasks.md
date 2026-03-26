## 1. Specification Deltas
- [x] 1.1 Update effects-system requirements for v1.3 base effects, overlay model, noise system, and grain behavior.
- [x] 1.2 Update creator-tool requirements for v1.3 effect controls, texture overlay controls, and grain controls.
- [x] 1.3 Update preset contract requirements to reflect v1.3 schema fields and deprecated overlay removals.

## 2. Implementation
- [x] 2.1 Add shader support for `bands` and `cellular` base effects.
- [x] 2.2 Replace legacy overlay paths (`liquidGlass`, procedural `ribbedGlass`) with `textureOverlay`.
- [x] 2.3 Add texture sampling controls (`texture`, `scale`, `intensity`, optional `distortion`) in shader and preset model.
- [x] 2.4 Add always-on grain pass with global intensity control and constrained range.
- [x] 2.5 Update creator-tool UI for new base effects and texture/grain controls.
- [x] 2.6 Remove deprecated overlay controls from creator-tool and migration paths.

## 3. Verification
- [x] 3.1 Validate OpenSpec change with `openspec validate update-visual-system-v1-3 --strict`.
- [x] 3.2 Confirm v1.3 preset import/export contract validation and migration messaging.
- [x] 3.3 Confirm default visuals remain performant under existing runtime guardrails.
