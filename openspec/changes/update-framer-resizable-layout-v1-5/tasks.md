## 1. Specification Deltas
- [x] 1.1 Add public Framer layout requirements for supported width/height layout annotations.
- [x] 1.2 Add requirements for default component dimensions and style-forwarded container layout.

## 2. Implementation
- [x] 2.1 Add `@framerSupportedLayoutWidth any` and `@framerSupportedLayoutHeight any` annotations to `SkapeAmbient`.
- [x] 2.2 Update `SkapeAmbient.defaultProps` to include `width: 400` and `height: 400`.
- [x] 2.3 Refactor render output to container-based layout (`div` wrapper + child canvas).
- [x] 2.4 Forward Framer `style` prop to wrapper and keep canvas at `100%` width/height.
- [x] 2.5 Preserve existing preset API and resolution-independent rendering behavior.

## 3. Verification
- [x] 3.1 Run `openspec validate update-framer-resizable-layout-v1-5 --strict`.
- [ ] 3.2 Manual Framer check: component defaults near `400x400`, is not fit-content locked, and is freely resizable.
