# Change: Framer Resizable Layout Fix V1.5

## Why
`SPEC_v1_5.md` identifies that `SkapeAmbient` behaves as intrinsic content in Framer (defaulting to `300x150` and `Fit Content`) instead of a layout-driven, freely resizable code component.

## What Changes
- Add explicit Framer layout support annotations for width and height.
- Set Framer-friendly default dimensions (`400x400`) while keeping rendering fill-container behavior.
- Refactor component root output to a container `<div>` that forwards Framer `style` props.
- Ensure canvas remains render-surface only and does not control component layout sizing.

## Impact
- Affected specs: `runtime-rendering`
- Affected code:
  - `SkapeAmbient.tsx` component signature, layout wrapper, default props, and canvas style behavior
