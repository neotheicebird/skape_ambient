## 1. Specification Deltas
- [x] 1.1 Modify runtime-rendering requirements to distinguish internal scaled rendering from public Framer field rendering.
- [x] 1.2 Add resolution-independent public rendering requirements for canvas sizing, viewport resolution uniforms, and UV basis.

## 2. Implementation
- [x] 2.1 Update `SkapeAmbient.tsx` canvas sizing to match client display size without internal resolution scale.
- [x] 2.2 Update viewport and `u_resolution` uniform writes to use canvas drawing-buffer dimensions.
- [x] 2.3 Update fragment shader UV calculation to centered field-space coordinates.
- [x] 2.4 Keep preset API and visual style unchanged while preserving time-stable animation.

## 3. Verification
- [x] 3.1 Run `openspec validate update-framer-resolution-field-v1-4 --strict`.
- [ ] 3.2 Verify Framer behavior across square, wide, and tall frames (manual visual check).
