---
trigger: model-decision
description: Consult when working on canvas/GPU rendering — theme-aware color resolution, DPR handling, render-loop patterns.
tier: tech:canvas
domain: performance
---

# Theme-Aware Canvas / GPU Rendering

> **Optimizes for:** correct design-token colors on canvas/GPU surfaces (WebGL, WebGPU, 2D
> `<canvas>`, data-viz renderers) that survive theme flips — because these surfaces can't read
> `var(--token)` and must resolve + repaint on their own.

## Context
Canvas and GPU surfaces — WebGL, WebGPU, 2D `<canvas>`, data-viz renderers — can't consume
`var(--token)`; they need *resolved* values (RGB arrays, hex, a `CanvasGradient`). To keep
design-system integrity and zero-hex tolerance, resolve tokens from the **active theme at runtime**
and re-resolve when the theme flips. The original COBE globe drove this pattern; it now covers any
token-driven canvas surface (e.g. a data-viz wheel or radar).

## Standard Pattern

### 1. Resolve tokens at runtime (not build time)
Read the computed value of a CSS custom property off a probe element, using an **override-token
family** that falls back to a semantic token — so one surface can be recolored without a fork and
without losing the system default.

```typescript
// Resolve `--dataviz-series-1` (override family) → `--chart-1` (semantic) → literal fallback.
function resolveToken(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const probe = document.createElement('div');
  probe.style.color = `var(${name}, var(--chart-1, ${fallback}))`;
  document.body.appendChild(probe);
  const rgb = getComputedStyle(probe).color; // always resolves to rgb()/rgba()
  document.body.removeChild(probe);
  return rgb || fallback;
}
// GPU libs wanting [0..1, 0..1, 0..1] parse the same rgb() string and divide by 255.
```

### 2. Repaint on theme flip
The theme flip mutates `data-theme` on `<html>` — that does NOT re-run a canvas draw. Observe it and
repaint, **re-resolving every token** (a cached RGB from the previous theme is a stale-color bug):

```typescript
const obs = new MutationObserver(() => repaint()); // re-resolve tokens + redraw
obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
```

### 3. Feature-detect newer canvas APIs against the browserslist floor
Newer canvas APIs (e.g. `createConicGradient`, WebGPU) aren't in every browser the project's
browserslist floor supports. Feature-detect and provide a graceful fallback — never assume:

```typescript
const grad = typeof ctx.createConicGradient === 'function'
  ? ctx.createConicGradient(0, cx, cy)
  : ctx.createLinearGradient(0, 0, w, h); // fallback within the floor
```

### 4. Share pure geometry between renderer and hit-test
Keep the geometry (angles, arc bounds, positions) in a **pure module** consumed by BOTH the draw code
and the pointer hit-test. If drawing and interaction compute geometry separately they drift, and the
clickable region stops matching the pixels. Pure geometry is also unit-testable without a canvas.

## Notes
- Use explicit opacity/transparency so rendering is consistent across high-brightness light and dark modes.
- For 3D (COBE/WebGL): use the full rotation matrix for label syncing (account for both `phi` and
  `theta`); re-initialize the instance on theme flip if the library caches colors internally.
