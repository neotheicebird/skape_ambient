# Skape Ambient — Visual System Update (OpenSpec v1.2)

---

## 0. Purpose

Refine the visual system to:

* improve visual quality
* remove weak or redundant effects
* introduce structured movement types
* integrate lightweight texture-based materials
* establish a consistent visual identity

---

## 1. Base Effects (Updated)

### Supported Effects

```ts
type BaseEffect = "flow" | "gas" | "burn" | "bands" | "cellular"
```

---

### 1.1 Flow

* smooth, continuous motion
* domain-warped noise
* low contrast

---

### 1.2 Gas

* layered atmospheric motion
* directional stretching
* soft blending

---

### 1.3 Burn

* thresholded noise
* animated edges
* high contrast

---

### 1.4 Bands (NEW)

* directional stripe-based motion
* stretched noise along one axis
* optional band compression

**Use case:**

* planetary stripes
* flowing ribbons
* structured gradients

---

### 1.5 Cellular (NEW)

* discrete organic shapes
* bubble / cell-like structures

**Implementation:**

* Worley noise or equivalent

---

## 2. Noise System (Updated)

### Supported Noise Types

* Simplex Noise (primary)
* FBM (3–4 iterations max)
* Worley Noise (for cellular)
* Value Noise (optional, lightweight)

---

### Constraints

* Max FBM iterations: 4
* Prefer 3 for performance

---

## 3. Overlay Effects (Refined)

### Supported Overlays

```ts
type Overlays = {
  chromaticAberration?: {...}
  pixelGrid?: {...}
  textureOverlay?: {...}
}
```

---

## 4. Removed Overlays

### ❌ Liquid Glass

* removed due to weak visual impact
* replaced by texture-based approach

---

### ❌ Procedural Ribbed Glass (old)

* removed (UV distortion approach)
* replaced by texture-based ribbed system

---

## 5. Texture Overlay System (NEW)

### Purpose

Introduce lightweight, repeatable material effects using grayscale textures.

---

### Structure

```ts
type TextureOverlay = {
  texture: string      // texture id
  scale: number
  intensity: number
  distortion?: number
}
```

---

### Behavior

* Sample texture using UV tiling
* Apply as:

  * brightness modulation (primary)
  * optional UV distortion (secondary)

---

### Texture Library (V1)

```
/textures/
  ribbed-fine.png
  ribbed-wide.png
  ribbed-diagonal.png
  frosted-soft.png
  grain.png
```

---

### Constraints

* Texture size: 256–512px
* Must tile seamlessly
* Grayscale only

---

## 6. Grain System (NEW — Core Identity)

### Purpose

Add subtle texture and character to all visuals.

---

### Implementation

* Screen-space noise using `gl_FragCoord`
* High-frequency
* very low intensity

---

### Behavior

* Always ON (no toggle)
* Intensity controlled globally

---

### Target Range

```
0.03 – 0.08
```

---

## 7. Chromatic Aberration (Retained)

### Purpose

Add optical/lens realism

---

### Implementation

* RGB channel offset sampling

---

### Constraints

* Keep subtle
* avoid strong color separation

---

## 8. Pixel Grid (Retained)

### Purpose

Introduce structured, digital aesthetic

---

### Behavior

* UV quantization
* optional grid lines

---

## 9. Preset Structure (Updated)

```ts
type Preset = {
  name: string

  palette: string
  effect: "flow" | "gas" | "burn" | "bands" | "cellular"

  speed: number
  distortion: number
  noise: number

  overlays?: {
    chromaticAberration?: {...}
    pixelGrid?: {...}
    textureOverlay?: TextureOverlay
  }
}
```

---

## 10. Creator Tool Updates

### 10.1 Base Effect Selector

* add:

  * bands
  * cellular

---

### 10.2 Overlay Controls

#### Keep

* chromatic aberration
* pixel grid

#### Replace

* ribbed glass → texture overlay

---

### 10.3 Texture Controls

* texture selector (dropdown)
* scale slider
* intensity slider
* optional distortion slider

---

### 10.4 Grain Control

* global intensity slider
* no toggle

---

## 11. Design Constraints

* 1 base effect per preset
* max 2 overlays recommended
* grain always applied
* avoid stacking all overlays

---

## 12. Removed Concepts

* ❌ liquid glass
* ❌ procedural ribbed glass
* ❌ redundant base effects (liquid)

---

## 13. Visual Direction

System evolves from:

> gradient generator

to:

> **procedural + texture-based material system**

---

## 14. Key Principle

Prioritize:

* visual clarity
* distinct presets
* controlled complexity

Avoid:

* effect stacking
* over-engineering
* redundant visuals

---
