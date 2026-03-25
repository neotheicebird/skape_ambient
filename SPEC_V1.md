# Skape Ambient — System Spec (v1 Final)

---

## 0. Goal

Build a **two-part system**:

1. **Creator Tool (internal)**

   * Used to design, tweak, and export presets
   * Full control over shader parameters

2. **Framer Component (public)**

   * Drop-in background component
   * Uses preset files only
   * Single-control UX (preset selector)

---

## 1. Product Philosophy

### Core Principle

**Separate creation from consumption**

* Complexity lives in the creator tool
* Simplicity lives in the public component

---

## 2. Distribution Strategy

### Free Version — “Skape Ambient”

* 7 high-quality presets
* Fully functional component
* Open source (Apache 2.0)

### Paid Version — “Skape Ambient PRO”

* +21 additional presets
* Distributed via Lemon Squeezy (~$5)
* Same component, extended preset library

---

## 3. System Architecture Overview

```
Creator Tool → Preset JSON Files → Framer Component
```

* Presets are the contract between systems
* Component does not generate presets
* Tool does not care about Framer

---

## 4. Preset File Format

### File Structure

```ts
type Preset = {
  name: string

  palette: string
  effect: "flow" | "liquid" | "burn"

  speed: number
  distortion: number
  noise: number

  glass: boolean
  glassSize: number
}
```

---

### Storage

```
/presets/
  free/
    soft-aurora.json
    neon-fog.json
  pro/
    liquid-ember.json
    burn-signal.json
```

---

### Rules

* One preset per file (modular)
* Human-readable JSON
* No runtime generation

---

## 5. Palette System

```ts
type Palette = {
  name: string
  colors: string[]
}
```

* Stored in `/palettes.ts`
* Shared between tool + component
* 10–15 curated palettes

---

## 6. Shader System (Shared Core)

### Technology

* GLSL fragment shader
* WebGL (via lightweight wrapper or raw)

---

### Effects (V1)

#### 1. Flow Field

* Domain-warped fbm
* Smooth, infinite motion

#### 2. Liquid Warp

* Higher distortion
* Energetic movement

#### 3. Burn / Dissolve

* Thresholded noise
* Expanding edge effect

---

### Core Techniques

* fbm (3–5 iterations)
* domain warping
* thresholding
* palette mapping

---

### Uniforms

```glsl
uniform float u_time;
uniform vec2 u_resolution;

uniform vec3 u_colors[6];
uniform int u_colorCount;

uniform float u_speed;
uniform float u_distortion;
uniform float u_noise;

uniform float u_glass;
uniform float u_glassSize;

uniform int u_mode;
```

---

## 7. Creator Tool (Internal)

### Purpose

Design presets visually and export JSON files.

---

### Stack

* React (simple app or Vite)
* WebGL canvas (same shader as component)

---

### Features

#### Live Preview

* Real-time shader rendering

#### Controls (FULL ACCESS)

* Palette selector
* Effect selector (flow/liquid/burn)
* Speed
* Distortion
* Noise
* Glass toggle
* Glass size

---

#### Preset Management

* Create new preset
* Edit existing preset
* Rename preset
* Export as JSON
* Save to `/presets/`

---

#### Optional (Nice to have)

* Duplicate preset
* Randomize (for exploration)
* Screenshot export

---

### Key Rule

The creator tool is:

* not polished
* not public
* built for speed, not beauty

---

## 8. Framer Component (Public)

### Component Name

`SkapeAmbient`

---

### Responsibilities

* Load preset list
* Apply preset values to shader
* Render canvas

---

### Public API

```ts
preset: string
```

---

### Behavior

* Dropdown lists preset names
* Selecting preset updates shader uniforms
* Canvas fills parent frame

---

### Preset Loading

Option A (simplest):

* Import preset JSON files directly

Option B:

* Bundle presets into a single file

---

## 9. Framer Property Controls

```ts
addPropertyControls(SkapeAmbient, {
  preset: {
    type: ControlType.Enum,
    options: presetNames,
  }
})
```

---

## 10. Layout Behavior

```css
position: absolute;
top: 0;
left: 0;
width: 100%;
height: 100%;
```

---

## 11. Performance Constraints

* Single draw call
* Max 6 colors
* Limit fbm iterations
* Avoid re-renders (use refs)
* Maintain smooth animation

---

## 12. Free vs PRO Separation

### Free Build

* Includes `/presets/free`

### PRO Build

* Includes:

  * `/presets/free`
  * `/presets/pro`

---

### Distribution

* Same component code
* Different preset bundles

---

## 13. Branding & Positioning

### Name

**Skape Ambient**

### Tagline

“Living backgrounds for Framer”

---

## 14. Launch Strategy

### Phase 1

* Ship free version (7 presets)
* Publish on GitHub
* Share in communities

### Phase 2

* Release PRO version (21 presets)
* Sell via Lemon Squeezy

---

## 15. Key Principle

This is not a shader tool.

This is:

> A system for creating and distributing living visual presets.

---

## 16. Long-Term Leverage

Scales via:

* more presets
* better taste
* audience growth

Not via:

* more controls
* more complexity
