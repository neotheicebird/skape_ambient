# Skape Ambient — Effects System Upgrade (OpenSpec v1.1)

---

## 0. Purpose

Upgrade the visual system from:

* simple gradient effects

to:

* **procedural field-based visuals + layered material overlays**

---

## 1. Effect Architecture (Updated)

### Split into two layers:

```ts
BaseEffect → generates motion + structure
OverlayEffects → modify appearance
```

---

## 2. Base Effects (Final V1 Set)

### Supported Effects

```ts
type BaseEffect = "flow" | "burn" | "gas"
```

---

### 2.1 Flow (Updated)

* Domain-warped fbm
* Smooth continuous motion
* Low contrast

**Use case:** ambient backgrounds

---

### 2.2 Burn

* Thresholded fbm
* Animated edge expansion
* Optional glow around edges

**Use case:** fire, energy, reveal effects

---

### 2.3 Gas (NEW)

**Description:**

* Simulates planetary gas clouds (Jupiter/Saturn style)

**Implementation:**

* fbm with directional stretching
* domain warping
* banding (optional)

**Shader characteristics:**

* elongated noise patterns
* layered motion
* soft gradients with flow direction

**Uniform considerations:**

* directional bias (vec2)
* band strength (float)

---

## 3. Overlay Effects System (NEW)

### Structure

```ts
type Overlays = {
  liquidGlass?: LiquidGlass
  ribbedGlass?: RibbedGlass
  chromaticAberration?: ChromaticAberration
  pixelGrid?: PixelGrid
}
```

---

## 4. Overlay Effects Definitions

---

### 4.1 Liquid Glass (Existing)

```ts
type LiquidGlass = {
  intensity: number
}
```

* subtle UV distortion
* used as polish layer

---

### 4.2 Ribbed / Fluted Glass (NEW)

```ts
type RibbedGlass = {
  intensity: number
  frequency: number
  angle: number
  mode: "linear" | "grid"
}
```

---

### Behavior

* Applies periodic distortion to UVs
* Uses sine wave or grid snapping
* Supports:

  * vertical ribs
  * horizontal ribs
  * angled ribs
  * square grid cells

---

### Implementation Notes

* Rotate UV using 2D rotation matrix
* Apply sine distortion along axis
* For grid mode:

  * apply quantization

---

### 4.3 Chromatic Aberration (NEW)

```ts
type ChromaticAberration = {
  intensity: number
  offset: number
  mode: "radial" | "directional"
}
```

---

### Behavior

* Splits RGB channels via UV offsets
* Creates lens distortion / light fringe

---

### Implementation

* Sample color 3 times:

  * R → offset +X
  * G → base
  * B → offset -X

* Combine channels into final color

---

### Performance Note

* Adds ~2 extra samples per pixel
* Keep intensity subtle

---

### 4.4 Pixel Grid (NEW)

```ts
type PixelGrid = {
  size: number
  lineStrength: number
}
```

---

### Behavior

* Quantizes UV into discrete cells
* Each cell samples gradient once
* Optional grid lines overlay

---

### Implementation

* `floor(uv * size) / size`
* derive cell color from center sample
* draw borders using smoothstep

---

## 5. Preset System Update

### Updated Preset Structure

```ts
type Preset = {
  name: string

  palette: string
  effect: "flow" | "burn" | "gas"

  speed: number
  distortion: number
  noise: number

  overlays?: {
    liquidGlass?: { intensity: number }
    ribbedGlass?: {
      intensity: number
      frequency: number
      angle: number
      mode: "linear" | "grid"
    }
    chromaticAberration?: {
      intensity: number
      offset: number
      mode: "radial" | "directional"
    }
    pixelGrid?: {
      size: number
      lineStrength: number
    }
  }
}
```

---

## 6. Creator Tool Updates

### Add Controls

#### Base Effect

* flow / burn / gas

---

### Overlay Toggles + Controls

#### Liquid Glass

* intensity slider

#### Ribbed Glass

* toggle
* intensity
* frequency
* angle
* mode (linear/grid)

#### Chromatic Aberration

* toggle
* intensity
* offset
* mode

#### Pixel Grid

* toggle
* size
* line strength

---

## 7. Framer Component Constraints

### Important

* NO overlay controls exposed to users
* All overlays are preset-driven
* Component remains:

  ```ts
  preset: string
  ```

---

## 8. Performance Constraints (Updated)

* fbm iterations: max 4
* max overlays active simultaneously: 2–3 recommended
* chromatic aberration should be optional per preset
* avoid nested loops in shader

---

## 9. Removed Features

* ❌ Remove "liquid" base effect
* ❌ Remove redundant gradient modes

---

## 10. Design Principles

* Each preset should:

  * use max 1 base effect
  * use 0–2 overlays ideally
  * feel visually distinct

---

## 11. Key Outcome

System evolves from:

> gradient generator

to:

> **procedural material system with cinematic effects**
