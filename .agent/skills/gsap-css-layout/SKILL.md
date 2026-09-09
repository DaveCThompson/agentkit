---
name: gsap-css-layout
description: Use when building or debugging GSAP animations that share responsive layout, visibility, or scroll-driven styles with React and CSS.
tier: tech:gsap
---

# GSAP and CSS layout animation

## When to use

Use for competing animation writers, responsive geometry, compact grids, gated reveals, and
animated text. Follow the project's motion contract and `pattern-motion.md`; the patterns below
are conditional techniques, not a required visual style. Diagnose-only requests end with evidence.

## Approach

First identify the element, property, writer, and lifetime involved. Check installed GSAP and
`@gsap/react` versions before adopting APIs. Two systems can own different properties on one
element. When both need the same property, compose separate inputs, use separate wrappers, or
hand ownership over explicitly. Do not clear a live scroll driver's styles to finish an intro.

### Responsive geometry with a CSS variable proxy

A unitless progress variable lets CSS combine intro progress with the current container size
and scroll inset. This avoids depending on a previously measured pixel endpoint when the
geometry changes. Direct tweens are still useful for fixed geometry; layout transitions can
also use measured endpoints with invalidation or GSAP Flip when appropriate.

```javascript
gsap.set(el, { '--expansion-progress': 0 });
tl.to(el, { '--expansion-progress': 1, duration: 0.5 });
```

```css
.frame {
  /* Responsive value composition; changing width still performs layout work. */
  width: calc(68px + (100% - var(--inset, 12px) * 2 - 68px) * var(--expansion-progress, 1));
}
```

The dimensions and timing are illustrative. If the required endpoint is full bleed, inspect
whether `max-width` or the inset already caps the element. Remove a cap only when it conflicts
with that endpoint. Keep it when the design requires a maximum. Profile layout cost when width
changes affect responsiveness; CSS variables do not turn layout into GPU-only work.
[Browser animation guidance](https://web.dev/articles/animations-guide) explains the rendering stages.

### Visibility proxy with a complete lifecycle

Inline `opacity` from `autoAlpha` can override a stylesheet's scroll opacity expression. Give
the intro its own variables instead. This example owns only two custom properties on `shell`;
no other writer may use them during this controller's lifetime. CSS defaults remain visible
when JavaScript never starts. The gate caller leaves content visible until it can start, or
calls the immediate path when motion is skipped.

```javascript
function createIntro(shell, { reducedMotion = false, onComplete = () => {} } = {}) {
  const names = ['--intro-alpha', '--intro-visibility'];
  const previous = names.map(name => [
    name, shell.style.getPropertyValue(name), shell.style.getPropertyPriority(name),
  ]);
  let tween;
  let completed = false;
  let disposed = false;
  const finish = () => {
    if (disposed || completed) return;
    shell.style.setProperty('--intro-alpha', '1');
    shell.style.setProperty('--intro-visibility', 'visible');
    completed = true;
    onComplete();
  };

  if (reducedMotion) {
    finish();
  } else {
    shell.style.setProperty('--intro-alpha', '0');
    shell.style.setProperty('--intro-visibility', 'visible');
    tween = gsap.to(shell, {
      '--intro-alpha': 1, duration: 0.3, onComplete: finish,
    });
  }

  return {
    reveal() { // Preference change or cancelled intro that must show its terminal state.
      tween?.kill();
      finish();
    },
    dispose() { // Teardown is not successful completion.
      if (disposed) return;
      disposed = true;
      tween?.kill();
      for (const [name, value, priority] of previous) {
        if (value) shell.style.setProperty(name, value, priority);
        else shell.style.removeProperty(name);
      }
    },
  };
}
```

```css
.shadow {
  opacity: calc(var(--intro-alpha, 1) * (1 - var(--scroll-progress, 0)) * 0.44);
  visibility: var(--intro-visibility, visible);
}
```

The inline snapshot and tween teardown above are one cleanup owner. It is a standalone
controller; call `dispose()` before remount or replacement. Do not also register its tween in
an independently reverted context that could restore an intermediate hidden state. In a
`useGSAP` implementation, let that context own the initial GSAP sets and tween instead, with
equivalent visible defaults and terminal paths. Never use `clearProps: 'all'` on shared elements.

### React lifecycle and gated entry

Keep initial state and its reveal under one lifecycle owner. A single `useGSAP` callback is a
useful way to coordinate a gate, but separate effects are valid for independent properties or
lifetimes. When dependency changes must replace the old animation, use `revertOnUpdate: true`.
An intentional persistent timeline can instead be updated by its owner. Scope selectors to the
component, and wrap late animation callbacks with `contextSafe` or explicitly track their cleanup.
Remove listeners and timers as well as timelines. See [GSAP's React guide](https://gsap.com/resources/React/)
and [context lifecycle](https://gsap.com/docs/v3/GSAP/gsap.context()/).

Do not rely on default-hidden SSR content with JavaScript as its only escape. Hide only after
the reveal can be scheduled, or supply a CSS/no-JS fallback and a bounded gate-failure path
appropriate to the product. If hiding before hydration is essential, verify delayed hydration
and failed startup explicitly. A layout effect cannot retroactively hide server HTML already painted.

Check reduced motion before hiding. Respond to preference changes during playback by finishing
the visible state. Complete upstream readiness signals on skip paths; do not re-arm loops or
signal success from an unmounted controller. Distinguish a cancelled reveal from teardown.
Exercise Strict Mode setup/cleanup, interrupted navigation, gate failure, and remounts where used.

### Compact grids and constraints

`display: none` removes a child from grid placement. For a layout whose logo must stay in the
center track while siblings disappear, assign the intended columns explicitly:

```css
.nav { grid-column: 1; }
.logo { grid-column: 2; }
.controls { grid-column: 3; }
```

This assumes a matching three-column template such as `minmax(0, 1fr) auto minmax(0, 1fr)`.
Check intrinsic content widths and overflow too. If keeping space is intended, visibility or
opacity may be a better choice than removing children; handle focusability deliberately.

For a container that begins smaller than its normal gutters, a progress-linked gap can preserve
centering: `gap: calc(var(--expansion-progress, 1) * 16px)`. Inspect computed track sizes, padding,
min-content constraints, and gaps before choosing this fix. There is no universal pixel offset.

### Sequencing and text

Choose easing from the product's motion language. `power3.out` is useful for a crisp stagger;
`back` and `elastic` intentionally overshoot. Confirm that overshoot fits the space and intent.
For independent multi-step sequences running together, add a child timeline per target at the
same parent position. Unpositioned tweens append at the timeline end and can serialize work.
Interrupt only the timeline/properties the current interaction owns.

For typing with a stable leading edge, use logical start alignment rather than forcing left
alignment in every language. Reserve line height for empty text. Size masks against the actual
font, line height, glyphs and zoom; a fixed font-size ratio cannot guarantee descender clearance.

If text-plugin matching gives the wrong deletion order, tween a count of grapheme clusters.
Use this only on a dedicated text node whose content this controller owns:

```javascript
const clusters = [...new Intl.Segmenter(locale, { granularity: 'grapheme' })
  .segment(originalText)].map(part => part.segment);
const proxy = { length: clusters.length };
rotationTl.to(proxy, {
  length: 0, duration: 0.6, ease: 'none',
  onUpdate: () => {
    target.textContent = clusters.slice(0, Math.ceil(proxy.length)).join('');
  },
});
```

Check [Intl.Segmenter support](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter)
for supported runtimes; use an existing grapheme-aware utility or a static phrase if unavailable.
Keep an accessible stable phrase and hide decorative character updates from assistive technology.
If a completed phrase conveys a meaningful status change, announce the whole phrase without
announcing every character. Restore owned text and SplitText DOM changes on teardown.

## Definition of done

- The intended reveal endpoint is visible, including skip, changed-preference and gate-failure paths.
- Resize, scroll and interruption preserve geometry and other writers' styles.
- Cleanup removes owned animations, listeners and text wrappers without reviving loops.
- Applicable browser checks cover compact layout, text clipping, focus and reduced motion.
- Report actual evidence and any unrendered states under `foundation-testing.md`; a build alone
  does not establish animation behavior.
