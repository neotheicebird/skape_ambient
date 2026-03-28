# Skape Ambient — Performance Budget System (OpenSpec Feature)

---

## 0. Purpose

Ensure all presets are:

* performant on real-world devices
* safe for website usage
* consistent in resource usage

Introduce a **performance budget system** inside the creator tool to:

* guide preset creation
* prevent heavy configurations
* enforce constraints visually

---

## 1. Core Principle

Ambient visuals should feel:

> smooth, subtle, and lightweight

NOT:

> computationally intensive or battery-draining

---

## 2. Target Performance Profile

### Default Runtime Targets

* Target FPS: **30 FPS**
* Max FPS: **45 FPS (optional, not default)**
* Resolution scale: **0.75x (default)**
* High quality: **1.0x (optional)**

---

## 3. Runtime Optimizations (Component-Level)

### 3.1 FPS Throttling

* Implement fixed FPS cap (default 30 FPS)
* Use `requestAnimationFrame` with time gating

---

### 3.2 Resolution Scaling

* Render canvas at scaled resolution
* Upscale to display size

```ts
scale = 0.75 (default)
```

---

### 3.3 Visibility Optimization

* Pause rendering when:

  * tab is inactive
  * component is offscreen

---

### 3.4 Motion Strategy

* Prefer slower motion over higher FPS
* Default presets should use low-to-moderate speed

---

## 4. Shader Budget Constraints

### 4.1 Base Effect Cost

| Effect | Cost |
| ------ | ---- |
| Flow   | 1    |
| Burn   | 2    |
| Gas    | 3    |

---

### 4.2 Overlay Cost

| Overlay              | Cost |
| -------------------- | ---- |
| Liquid Glass         | 1    |
| Ribbed Glass         | 1    |
| Pixel Grid           | 1    |
| Chromatic Aberration | 2    |

---

### 4.3 fbm Iterations

* Max: **4**
* Recommended: **3**

---

## 5. Preset Performance Budget

### Budget Limit

```ts
MAX_BUDGET = 5
```

---

### Budget Calculation

```ts
totalCost = baseEffectCost + sum(activeOverlayCosts)
```

---

### Rules

* Ideal presets: **3–4**
* Max allowed: **5**
* Avoid >5 (should be flagged)

---

## 6. Creator Tool — Performance UI

### 6.1 Budget Indicator

Display in UI:

```
Performance: ●●●○○ (3/5)
```

or

```
Performance Score: 3 / 5
```

---

### 6.2 Color Coding

* 1–2 → 🟢 Light
* 3–4 → 🟡 Balanced
* 5 → 🔴 Heavy

---

### 6.3 Live Feedback

* Updates in real-time as user toggles effects
* Visible at all times during editing

---

### 6.4 Warnings

If budget > 5:

* Show warning:

  > “This preset may impact performance on some devices”

---

## 7. Preset Guidelines (Enforced by Tool)

### Recommended Composition

* 1 base effect
* 0–2 overlays

---

### Avoid

* Gas + chromatic aberration + multiple overlays
* stacking all effects together

---

### Suggested Patterns

* Flow + ribbed glass
* Burn + chromatic aberration
* Gas + pixel grid

---

## 8. Preset Metadata (Optional Extension)

```ts
performanceScore: number
```

* stored during export
* useful for debugging and future filtering

---

## 9. Creator Tool Behavior

* Do NOT block creation of heavy presets
* Only:

  * inform
  * guide
  * warn

---

## 10. Framer Component Behavior

* Always enforce:

  * FPS cap
  * resolution scaling
  * visibility pause

* Do NOT expose performance controls to end user (v1)

---

## 11. Non-Goals

* No dynamic quality switching (v1)
* No device detection logic
* No adaptive rendering (future scope)

---

## 12. Future Scope (Optional)

* Auto downgrade quality on low FPS
* Preset filtering by performance
* “Mobile safe” preset tag

---

## 13. Key Outcome

Transforms performance from:

> hidden technical concern

into:

> visible design constraint

---

## 14. Guiding Principle

Every preset should feel:

* visually rich
* computationally light

---
