# Skape Ambient — Framer Resizable Layout Fix (OpenSpec Feature)

---

## 0. Purpose

Fix the issue where the component:

* defaults to **300×150**
* is set to **Fit Content**
* cannot be resized in Framer

Ensure the component behaves as:

> a **fully resizable layout-driven component**

---

## 1. Desired Behavior

### When added to canvas:

* Default size ≈ **400 × 400**
* Resize handles are visible
* User can freely resize

---

### When resized:

* Component fills container
* Gradient adapts (no stretching)
* Layout behaves like native Framer components

---

## 2. Root Cause

Current component:

* behaves as **intrinsic (content-sized)**
* returns `<canvas>` directly or similar
* does NOT support Framer layout system

---

## 3. Required Fixes

---

### 3.1 Enable Framer Layout Support (CRITICAL)

Add annotations above component:

```ts
/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
```

This ensures:

* component is NOT locked to “fit content”
* user can resize freely ([Framer][1])

---

### 3.2 Provide Default Dimensions

```ts
SkapeAmbient.defaultProps = {
  preset: "Sea Drift",
  width: 400,
  height: 400,
}
```

---

### 3.3 Use Container-Based Layout (MANDATORY)

Component must return:

```tsx
<div style={{ ...style, width: "100%", height: "100%" }}>
  <canvas ref={canvasRef} />
</div>
```

---

### 3.4 Forward Framer Style Props

Component must accept and apply:

```ts
const { style, ...rest } = props
```

Then:

```tsx
<div style={{ ...style, width: "100%", height: "100%" }}>
```

---

### 3.5 Canvas Must Not Define Layout

Canvas must:

```ts
canvas.style.width = "100%"
canvas.style.height = "100%"
```

---

### 3.6 DO NOT Use Intrinsic Sizing

Remove any logic that:

* measures content size
* sets width/height dynamically
* depends on canvas default size (300×150)

---

## 4. Layout Rules

Follow Framer best practices:

* No fixed width/height inside component
* Always support “fill container” behavior ([Allsite][2])
* Component size controlled by parent frame

---

## 5. Acceptance Criteria

After fix:

* Component is NOT “Fit Content”
* Resize cursor appears
* User can drag to resize
* Default size is ~400×400
* Works in stacks, grids, and free layout
* No layout glitches

---

## 6. Non-Goals

Do NOT:

* add width/height props for users
* lock aspect ratio
* introduce layout controls

---

## 7. Key Principle

> The component should behave like a **container**, not like content

---

[1]: https://www.framer.com/developers/auto-sizing?utm_source=chatgpt.com "Framer Developers: Auto-Sizing"
[2]: https://www.allsite.pro/insights/code-components-in-framer-the-complete-guide?utm_source=chatgpt.com "Code Components in Framer"
