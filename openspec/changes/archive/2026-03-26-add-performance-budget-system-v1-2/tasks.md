## 1. Specification Deltas
- [x] 1.1 Add creator-tool requirements for performance budget scoring and live UI feedback.
- [x] 1.2 Modify creator-tool preset contract to include optional `performanceScore`.
- [x] 1.3 Add runtime-rendering capability requirements for FPS capping, resolution scaling, and visibility pausing.

## 2. Implementation
- [x] 2.1 Add budget-cost constants for base effects and overlays in creator-tool logic.
- [x] 2.2 Implement live performance score indicator with level labels (Light/Balanced/Heavy).
- [x] 2.3 Add advisory warning when total score exceeds the maximum budget.
- [x] 2.4 Update preset export/import typing for optional `performanceScore`.
- [x] 2.5 Implement runtime frame gating and default 30 FPS cap.
- [x] 2.6 Implement scaled render resolution default (`0.75`) with optional `1.0` mode.
- [x] 2.7 Pause rendering when tab is inactive or component is offscreen and resume safely.

## 3. Verification
- [x] 3.1 Validate OpenSpec change with `openspec validate add-performance-budget-system-v1-2 --strict`.
- [x] 3.2 Verify creator-tool warnings remain non-blocking for export.
- [x] 3.3 Verify default runtime profile (30 FPS + 0.75 scale + visibility pause) is enforced.
