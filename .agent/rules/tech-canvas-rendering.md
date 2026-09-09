---
trigger: model-decision
description: Consult when working on canvas/GPU rendering — theme-aware color resolution, DPR handling, render-loop patterns.
tier: tech:canvas
domain: performance
---

# Theme-Aware Canvas / GPU Rendering

Resolve actual theme colors into the renderer's supported representation and redraw when inputs
change. Canvas bitmaps/GPU uniforms do not automatically track CSS custom properties or theme flips;
a color helper alone cannot prove rendering fidelity or performance.

## Context

Discover the canvas/library API, color space and token scope. A 2D context accepts supported CSS
color values, while GPU libraries may require numeric channels in a particular color space and
alpha convention. CSS custom-property token text is not necessarily a resolved color.
Use `foundation-design-tokens.md` for roles/exceptions, not zero-hex tolerance.
See [CSS color serialization](https://www.w3.org/TR/css-color-4/#serializing-color-values)
and [HTML canvas](https://html.spec.whatwg.org/multipage/canvas.html).

## Standard Pattern

### 1. Resolve tokens at runtime (not build time)

An existing project color resolver is preferable when it handles the renderer's accepted formats.
A computed-color probe is one option. Place it in the actual theme scope, not always the document
body. This example accepts trusted application-owned custom-property names and fallback colors:

```javascript
function resolveToken(scope, name, fallback) {
  if (!scope) return fallback; // Caller supplies the SSR/no-DOM fallback.
  const doc = scope.ownerDocument;
  const view = doc.defaultView;
  if (!scope.isConnected || !view) return fallback;
  const probe = doc.createElement('span');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;';
  probe.style.color = `var(${name}, ${fallback})`;
  try {
    scope.appendChild(probe);
    return view.getComputedStyle(probe).color || fallback;
  } finally {
    probe.remove();
  }
}
```

Choose a scope that permits the temporary child without affecting meaningful content or selectors.
Computed color is not guaranteed to be `rgb()`/`rgba()`; it can retain a modern color space.
Do not split an arbitrary string and divide by 255 for a GPU API. Use the renderer's supported
parser/conversion and explicitly handle gamut, alpha and linear versus encoded RGB.
A defined-but-invalid custom property can invalidate the color declaration instead of using the
`var()` fallback. Validate real token definitions and inspect effective colors; this helper does
not claim to detect every invalid token or stylesheet override.

### 2. Repaint on theme flip

Subscribe to the actual theme source and token scope. A `MutationObserver` for `data-theme`
fits only a contract that really changes that attribute. Classes, media-query preferences and
component-scoped themes need their own invalidation path.
Re-resolve affected colors before drawing/updating uniforms, or recreate a renderer only if its
API caches them without update support. Coalesce redundant work and release owned subscriptions,
observers, render loops and GPU resources on teardown.

### 3. Feature-detect newer canvas APIs against the browserslist floor

Check the actual browser/device support contract; not every project uses browserslist.
Feature detection must include context/device acquisition failure, not only method presence.
For an existing 2D context, a conic-gradient fallback might be:

```javascript
const grad = typeof ctx.createConicGradient === 'function'
  ? ctx.createConicGradient(0, cx, cy)
  : ctx.createLinearGradient(0, 0, w, h);
```

The linear gradient is visually different; accept it only when it preserves the information being
conveyed. Provide a meaningful static/DOM alternative when the rendering API is unavailable.
Handle context/device loss where applicable rather than leaving a stale interactive bitmap.

### 4. Share pure geometry between renderer and hit-test

Use one geometry contract for draw and interaction, preferably a pure shared module. Match
angles, bounds and coordinate transforms, including scroll/CSS transforms and device-pixel ratio.
Size the backing buffer against actual display size/DPR and reset the drawing transform deliberately
after resize; do not compound scaling each frame. Bound resolution by measured quality/memory cost.
Test boundary points and equivalent draw/hit-test transforms, plus keyboard/accessible alternatives.

## Notes

- Verify opacity and composited colors in actual supported themes, including modern/wide-gamut tokens.
- For 3D labels, use the renderer's complete camera/model/projection transforms; a phi-only
  calculation can drift when theta or camera changes. Discover the actual library coordinates.
- Compare first draw, theme/scope changes, resize/DPR changes, context failure and teardown.
  Pure/helper tests cannot certify browser color serialization, pixel output or GPU behavior.
