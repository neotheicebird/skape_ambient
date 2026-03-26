# Change: Performance Budget System V1.2

## Why
`SPEC_V1_2.md` defines explicit performance constraints needed to keep ambient presets smooth and lightweight on real-world devices. Today those constraints are not represented as formal OpenSpec requirements.

## What Changes
- Add a creator-tool performance budget model with effect and overlay costs.
- Add always-visible performance UI feedback (score, status level, and warnings).
- Add non-blocking heavy-preset warnings when budget exceeds threshold.
- Add runtime rendering constraints for FPS capping, resolution scaling, and visibility pausing.
- Extend preset export contract to allow optional `performanceScore` metadata.
- Keep performance controls internal; public component remains preset-driven.

## Impact
- Affected specs: `creator-tool`, `runtime-rendering` (new capability)
- Affected code:
  - creator-tool state/calculation for budget scoring
  - creator-tool UI for live performance feedback
  - runtime render loop and canvas sizing behavior
  - preset import/export schema typing and validation
