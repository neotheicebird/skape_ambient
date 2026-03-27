# Change: Framer Resolution-Independent Rendering V1.4

## Why
`SPEC_V1_4.md` requires the public Framer component to render as a continuous field so resizing reveals more or less of the gradient instead of stretching/scaling sampled output.

## What Changes
- Scope default `0.75` internal render scale behavior to the internal runtime profile only.
- Add public Framer runtime requirement for resolution-independent field rendering using display-matched canvas buffer dimensions.
- Require centered field-space UV coordinates in shader sampling for the public component.
- Require stable time-driven animation behavior that does not drift with component size changes.

## Impact
- Affected specs: `runtime-rendering`
- Affected code:
  - `SkapeAmbient.tsx` canvas resize and viewport/uniform updates
  - `SkapeAmbient.tsx` fragment shader UV coordinate basis
