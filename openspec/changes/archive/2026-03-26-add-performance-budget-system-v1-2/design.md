## Context
V1.2 introduces a performance budget system that is both a runtime constraint and a creator-time guidance model. The feature spans editor UX, preset metadata, and rendering behavior.

## Goals / Non-Goals
- Goals:
  - Make performance cost visible while authoring presets.
  - Define concrete runtime defaults for frame rate and render scale.
  - Prevent hidden performance regressions without blocking creative iteration.
- Non-Goals:
  - Device detection logic.
  - Dynamic/adaptive quality switching in v1.2.
  - Public Framer controls for performance tuning.

## Decisions
- Decision: Use a fixed budget model `MAX_BUDGET = 5` with static costs per base effect and overlay.
  - Rationale: Predictable, easy to communicate, and aligned with spec guidance.
- Decision: Budget feedback is advisory only (warn, do not block export).
  - Rationale: Preserves creator flexibility while still signaling risk.
- Decision: Runtime enforces fixed defaults (`30 FPS`, render scale `0.75`) with optional higher-quality internal settings.
  - Rationale: Optimizes for broad website safety by default.
- Decision: Add optional `performanceScore` to exported preset metadata.
  - Rationale: Supports debugging and future filtering without making score mandatory.

## Risks / Trade-offs
- Static costs may not perfectly match all hardware outcomes.
  - Mitigation: Keep model intentionally conservative and tune in future changes.
- Reduced resolution may slightly soften output.
  - Mitigation: Keep optional high-quality mode at render scale `1.0`.
- Visibility pausing can cause time-jump artifacts on resume.
  - Mitigation: Reset frame timing gate on resume.

## Migration Plan
1. Introduce score calculation and UI feedback in creator tool.
2. Update preset schema to optionally include `performanceScore`.
3. Add runtime loop constraints and visibility pause behavior.
4. Validate existing presets still import/export without required metadata additions.

## Open Questions
- None for v1.2 scope.
