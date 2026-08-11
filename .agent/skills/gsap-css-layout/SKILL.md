---
name: gsap-css-layout
description: Advanced rules for marrying GSAP timelines with React UI components to prevent unhandled layout shifts and grid bugs.
tier: tech:gsap
---

# Skill: GSAP × CSS Layout Animation

When using GSAP inside React for layout-affecting animations (width, position, visibility toggling), follow these principles to prevent sub-pixel snapping, interpolation jank, CSS Grid drift, and stale inline styles that collide with scroll-driven systems.

**Scope**: Any component where GSAP timelines coexist with CSS-driven layout (Grid, Flexbox) or with Framer Motion scroll-linked values.

---

## Principle 1: CSS Variable Proxy — Never Tween Layout Strings

GSAP's internal interpolation engine parses CSS values as strings. When a target value depends on responsive units (`%`, `vw`, `calc()`), GSAP snapshots the *computed* pixel value at tween start and interpolates toward the *computed* pixel value at tween end. This is fragile: resize events, container queries, and scroll-linked variable changes all invalidate the snapshot silently.

**THE RULE:**
Tween a unitless CSS custom property (`0 → 1`) and let native CSS `calc()` consume it.

```javascript
// BAD — GSAP snapshots a stale pixel value
tl.to(el, { width: 'calc(100% - 24px)', maxWidth: '1240px' });

// GOOD — browser recalculates every frame natively
gsap.set(el, { '--expansion-progress': 0 });
tl.to(el, { '--expansion-progress': 1, duration: 0.5 });
```

```css
.frame {
  /* Browser GPU handles responsive math at paint time */
  width: calc(68px + (100% - var(--inset) * 2 - 68px) * var(--expansion-progress, 1));
}
```

**WHY THIS MATTERS FOR FUTURE WORK**: Every scroll-scrubbed section, text reveal container, or parallax layer that also has an intro sequence should use this pattern. It is the only way to guarantee that a GSAP intro tween and a Framer Motion `useTransform` scroll driver can coexist on the same element without one overwriting the other's inline styles.

---

## Principle 2: GSAP Inline Styles Poison Scroll-Linked CSS

When GSAP writes `opacity: 1` via `autoAlpha: 1`, it stamps an **inline style** on the element. That inline style has higher specificity than any CSS class or custom property expression. If the same property is also driven by a scroll-linked CSS variable (e.g., `opacity: calc(...)` in the stylesheet), the scroll formula becomes permanently dead.

**THE RULE:**
For any property that is *also* scroll-driven or theme-driven in CSS, proxy the GSAP intro through a dedicated CSS variable instead of animating the property directly.

```javascript
// BAD — stamps inline opacity:1 that kills scroll fade
tl.to(shadowEl, { autoAlpha: 1 });

// GOOD — proxy variable, CSS multiplies it into the scroll formula
gsap.set(shell, { '--intro-alpha': 0, '--intro-visibility': 'hidden' });
tl.to(shell, { '--intro-alpha': 1, duration: 0.3 });
```

```css
.shadow {
  /* Intro proxy × scroll expression — both work simultaneously */
  opacity: calc(var(--intro-alpha, 1) * ((1 - var(--scroll-progress)) * 0.44));
  visibility: var(--intro-visibility, visible);
}
```

**CRITICAL INVARIANT**: After any GSAP intro timeline completes, *zero* inline `opacity`, `visibility`, `width`, or `transform` styles should remain on elements that also participate in scroll-driven CSS. Use `clearProps` or proxy variables exclusively.

---

## Principle 3: CSS Grid Auto-Placement Destruction

When GSAP sets `display: none` on grid children to sequence their entrance, CSS Grid collapses those tracks entirely. The remaining visible child falls under the auto-placement algorithm, which assigns it to the **first available** column — destroying symmetric centering.

**THE RULE:**
When mixing GSAP `display` toggling with CSS Grid symmetric layouts (`1fr auto 1fr`), you **MUST** hardcode `grid-column` on every child.

```css
/* CRITICAL: Prevents auto-placement when siblings are display:none */
.navWrapper     { grid-column: 1; }
.logo           { grid-column: 2; }
.controlsWrapper { grid-column: 3; }
```

When columns 1 and 3 are `display: none`, column 2 remains anchored because `1fr` divisions distribute the remaining space evenly around the explicit center track.

---

## Principle 4: Grid Gap Overflow at Compact Scale

If the container starts extremely small (e.g., 68px circle) and the grid has a static `gap: 16px`, the gap alone may exceed the container bounds. CSS Grid resolves overflows left-to-right, pushing centered content off-axis by exactly the unaccommodatable gap pixels.

**THE RULE:**
Bind grid `gap` to the expansion proxy so it starts at 0 and grows with the container:

```css
.bar {
  gap: calc(var(--expansion-progress, 1) * 16px);
}
```

---

## Principle 5: Never Use `max-width` in Proxy Formulas When Scroll Variables Coexist

If a CSS variable formula already uses a scroll-driven inset (e.g., `var(--current-inset-side)` that resolves from `max(12px, ...)` down to `0`), adding a static `max-width` inside the same `calc()` creates a hard ceiling that the scroll driver can never exceed.

```css
/* BAD — max-width caps at 1240px even when scroll wants full bleed */
width: calc(68px + (100% - var(--inset) * 2 - 68px) * var(--expansion-progress));
max-width: calc(68px + (1240px - 68px) * var(--expansion-progress));

/* GOOD — scroll-driven --inset naturally constrains width at rest */
width: calc(68px + (100% - var(--inset) * 2 - 68px) * var(--expansion-progress));
/* No max-width needed — --inset handles the 1240px cap via its own formula */
```

---

## Principle 6: Crisp Stagger Easing — No Wobble

For sequential item entrances (nav links, control icons, list items), avoid easing functions that mathematically overshoot `1.0`:

| Ease | Overshoot? | Use case |
|:-----|:-----------|:---------|
| `back.out(1.7)` | ✅ Yes — wobble | Playful/bouncy single elements |
| `elastic.out` | ✅ Yes — springy | Attention-grabbing hero elements |
| `power3.out` | ❌ No | **Crisp sequential fire** — recommended for staggered UI |
| `power4.out` | ❌ No | Cinematic, slightly sharper deceleration |

For staggered sequences, combine with tight timing:
```javascript
tl.from(items, {
  autoAlpha: 0,
  y: 8,
  stagger: 0.04,   // rapid sequential fire
  duration: 0.35,
  ease: 'power3.out',
}, absoluteLabel);
```

---

## Principle 7: FOUC Prevention Architecture (Single Hook Rule)

Elements that participate in GSAP intro timelines must be invisible *before* React hydration completes. For purely client-rendered components, use `gsap.set` inside `useGSAP` for the initial hidden state. For components that are also SSR-rendered (where CSS applies before JS loads), combine a CSS module default-hidden rule with a data-attribute CSS override — see the CSS + data-attribute pattern below.

**CRITICAL**: Use a **single** `useGSAP` hook with `revertOnUpdate: true` for both initial hide and gated animation. Two hooks create independent GSAP contexts with independent cleanup cycles, allowing a rendered frame where elements flash visible — a "partial fade, then restart" double-animation glitch. `revertOnUpdate: true` ensures each dependency change gets a clean context; since `useGSAP` runs in `useLayoutEffect`, the revert + re-run is atomic before browser paint.

```tsx
// CORRECT: single hook — initial hide + gated animation in one context
useGSAP(() => {
  gsap.set([titleEl, descEl], { opacity: 0, y: 28, visibility: 'hidden' });

  if (!isGateOpen) return; // wait for upstream signal

  gsap.timeline()
    .to(titleEl, { opacity: 1, y: 0, visibility: 'visible' })
    .to(descEl, { opacity: 1, y: 0, visibility: 'visible' }, '-=0.3');
}, { scope: containerRef, dependencies: [isGateOpen], revertOnUpdate: true });

// INCORRECT: two hooks, no revertOnUpdate
useGSAP(() => {
  gsap.set([titleEl, descEl], { opacity: 0, visibility: 'hidden' });
}, { scope: containerRef }); // ← separate context, separate cleanup

useGSAP(() => {
  if (!isGateOpen) return;
  gsap.to([titleEl, descEl], { opacity: 1, visibility: 'visible' });
}, { scope: containerRef, dependencies: [isGateOpen] });
```

### CSS + data-attribute override (SSR-safe gated animation)

For components that render on the server with content already hidden by CSS, pair the hiding rule with a data-attribute override that GSAP or React sets when animation is skipped:

```css
/* Default: hidden for animation (applies on SSR before JS loads) */
.root :global([data-hero-reveal]) { opacity: 0; visibility: hidden; }

/* Override: visible when animation is skipped or complete (higher specificity) */
.root[data-hero-revealed='true'] :global([data-hero-reveal]) { opacity: 1; visibility: visible; }
```

Set `el.dataset.heroRevealed = 'true'` in the non-animated code paths (reduced motion, post-intro navigation, tween `onComplete`). This means elements are visible via pure CSS even if the GSAP context is reverted externally — resilient to `revertOnUpdate` and unmount/remount cycles.

**Why this is safe**: When `revertOnUpdate` causes `context.revert()`, GSAP inline styles are removed and elements fall back to their CSS state. Because the CSS default is hidden, there is no flash. The new callback then re-applies the hidden state and starts the tween.

---

## Principle 8: Dynamic Text Masking & Typing Alignment

Changing text content (via `TextPlugin` or manual swapping) causes the container's width to recalculate. If the container is centered (`margin: auto`, `justify-content: center`, or `text-align: center`), the **start** of the text will shift as characters are added/removed — creating a distracting "sliding" effect.

**THE RULES:**
1. **Anchor the Alignment**: For any dynamic text phrase, lock the parent container to the left edge using `display: grid` + `justify-items: start` or explicit `text-align: left`.
2. **Maintain Vertical Presence**: Use an invisible zero-width character (e.g., `&nbsp;` with `width: 0`) or a `min-height` that matches the `line-height` to prevent the line from collapsing during empty states.
3. **Proxy Property Backspacing (Mandatory)**: If `TextPlugin` exhibits non-linear deletion, use the **Proxy Property pattern** for 100% predictable right-to-left backspacing. This prevents "matching" heuristics from causing left-deletion:
   ```javascript
   const proxy = { len: originalText.length };
   rotationTl.to(proxy, {
     duration: 0.6,
     len: 0,
     ease: 'none',
     onUpdate: () => {
       target.innerText = originalText.substring(0, Math.ceil(proxy.len));
     }
   });
   ```
4. **Descender Clearance**: If using vertical masks (`overflow: hidden`), the mask height MUST be 1.25x - 1.5x the font size to accommodate descenders (g, y, p) without clipping. Adjust layout gaps using negative margins on the wrapper rather than shrinking the mask.

---

## Checklist: Before Shipping Any GSAP Timeline

- [ ] No inline `width`, `opacity`, `transform`, or `visibility` left on scroll-driven elements after timeline completes
- [ ] All grid children have explicit `grid-column` if any sibling uses `display: none`
- [ ] Grid `gap` scales with expansion proxy if container starts below gap threshold
- [ ] `prefers-reduced-motion` short-circuits the timeline and fires the completion callback
- [ ] No `max-width` in formulas where a scroll variable already provides responsive capping
- [ ] Staggered entrances use `power3.out` or `power4.out` — no `back.out` or `elastic.out`
- [ ] Dynamic text containers are anchored (left/start) to prevent horizontal "sliding" during content mutation
- [ ] Masked containers provide sufficient bottom clearance for font descenders
