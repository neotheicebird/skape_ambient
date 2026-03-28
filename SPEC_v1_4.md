Update the existing SkapeAmbient Framer component to support **resolution-independent rendering**.

---

## Goal

Ensure the gradient behaves like a **continuous field**, not a stretched image.

Resizing the component should:

* reveal more/less of the gradient
* NOT stretch or scale it

---

## Tasks

### 1. Canvas Resize Handling

* Ensure canvas drawing buffer matches display size:

```ts
const width = canvas.clientWidth
const height = canvas.clientHeight

if (canvas.width !== width || canvas.height !== height) {
  canvas.width = width
  canvas.height = height
}
```

* Update viewport:

```ts
gl.viewport(0, 0, canvas.width, canvas.height)
```

---

### 2. Pass Resolution to Shader

Ensure uniform:

```ts
u_resolution = [canvas.width, canvas.height]
```

---

### 3. Fix UV Calculation in Shader

Replace any UV logic with:

```glsl
vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
```

---

### 4. Remove Any Scaling-Based Logic

* Remove any code that scales gradient based on width/height
* Do NOT use normalized 0–1 UV tied to aspect without correction

---

### 5. Ensure Animation Stability

* Animation must depend only on time
* No resolution-dependent offsets

---

### 6. Validate Behavior

Test:

* small square → looks like zoomed-in gradient
* wide frame → reveals more horizontal space
* tall frame → reveals more vertical space

---

## Constraints

* Do NOT change preset system
* Do NOT modify visual style
* Do NOT add new props
* Only fix rendering behavior

---

## Output

Return updated `SkapeAmbient.tsx` with:

* correct resize handling
* correct shader UV logic
* stable animation across sizes
