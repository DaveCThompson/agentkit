---
trigger: model-decision
description: Consult before writing Framer Motion animations — import surface, scroll reveals, layoutId animations, page transitions, scroll-linked values, useReducedMotion.
tier: tech:framer-motion
domain: motion
---

# Framer Motion Patterns

Rules for using Framer Motion correctly. For GSAP-specific rules see `pattern-motion.md`. For the library selection decision table see the project's animation-strategy spec (path in `project-invariants.md`).

## 0. Import Surface

All motion primitives, hooks, types, and variant factories are imported from `@app/motion`, never directly from `framer-motion`. The motion package re-exports the full Framer Motion surface (`export * from 'framer-motion'`) plus this project's shared variants, GSAP bindings, and the normalised `useReducedMotion`.

- App code must have zero direct `from 'framer-motion'` imports. Verify with `grep -r "from 'framer-motion'" apps/`.
- One import statement per source module. Do not leave multiple adjacent imports from `@app/motion` in the same file; merge them.

## 1. When to Use Framer Motion

Framer Motion is the default for:

- **UI state transitions**: hover, press, focus — use `whileHover`, `whileTap`
- **Scroll reveals**: standard section/card entrances — use `whileInView`
- **Layout animations**: magic-move transitions between positions — use `layout` + `layoutId`
- **Page transitions**: route enter/exit — use `AnimatePresence`
- **Scroll-linked values**: header morphing, parallax offsets — use `useScroll` + `useTransform`

Use GSAP instead when: complex multi-track timelines, SplitText character reveals, TextPlugin typing effects, or ScrollTrigger scrubbing are required.

## 2. Scroll Reveals (`ScrollReveal`)

Always use the `ScrollReveal` wrapper — do not replicate `whileInView` inline on one-off elements.

```tsx
<ScrollReveal>
  <SurfaceCard>...</SurfaceCard>
</ScrollReveal>
```

- Fires once (`once: true`) by default
- Reduced motion: swaps to `noMotionVariants` (instant, no transform)
- Default direction: vertical `y` only — never `x` drift

## 3. Layout Animations (`layoutId`)

Used for the nav active-state pill. Rules:

- Shared `layoutId` values must be unique across the page — collisions cause jumps
- When animating into an overlay or viewer, the destination `motion` node must own a deterministic box on first render. Do not let a lazily-mounted child image, async content, or portal-time measurement define the geometry after the `layoutId` node appears.
- For shared-element media viewers, keep the source frame mounted through the opening sample and only visually hide it after the destination is active. Hiding it too early causes first-open snaps.
- If the source is inside a clipped, scrolling, or reused track, use a fixed-position proxy as the `layoutId` source. Give the proxy an explicit lifecycle: arm for opening, render during closing, and never keep it mounted while idle.
- Strip `y` from the `transformTemplate` when the element participates in scroll-driven geometry — measurement artifacts from scroll morphing will otherwise cause the pill to drift vertically during navigation

```tsx
<motion.div
  layoutId="activeNav"
  transformTemplate={({ x, scaleX, scaleY }) =>
    `translateX(${x ?? '0px'}) scaleX(${scaleX ?? 1}) scaleY(${scaleY ?? 1})`
  }
/>
```

## 4. Page Transitions (`PagePresence`)

`PagePresence` is currently a plain `<div>` wrapper — **no AnimatePresence, no motion.div, no enter/exit variants**. Page-local GSAP components (HeroReveal, Home timeline) own all entry animation.

Do NOT restore `AnimatePresence` + `key={pathname}` to PagePresence. That pattern unmounts the page component tree on every navigation, killing in-flight GSAP timelines and causing HeroReveal to re-evaluate its gate on every route change — the root cause of the double-animation regression.

If a route-level cross-fade is needed in the future, use a CSS `transition: opacity` toggled via a className on the PagePresence container — no remount, GSAP timelines survive.

The `pagePresenceVariants` and `noMotionPagePresenceVariants` factories remain in `@app/motion` for reference but are not currently applied.

## 5. Scroll-Linked Values (`useScroll` + `useTransform`)

Used for the header scroll-morphing sequence. Rules:

- **Never** let GSAP write inline `opacity`, `transform`, or `width` on an element that also receives a Framer Motion `MotionValue`. GSAP inline styles have higher specificity and permanently override the motion expression.
- When coexistence is required, use a CSS variable proxy in GSAP and read it in the Framer Motion `style` prop via `useTransform`.
- Decouple scroll progress per property when they should respond at different rates:
  ```tsx
  const geometryProgress = useTransform(scrollYProgress, [0, 0.12], [0, 1]);
  const materialProgress = useTransform(scrollYProgress, [0, 0.10], [0, 1]);
  ```

## 6. Motion Initialization (`initial`)

- **Always define `initial` state**: To prevent console warnings and "animate from undefined" artifacts, explicitly declare values for all properties used in the `animate` prop.
- **Entry Logic**: When using `entryPlayed` state to disable initial entry animations on subsequent mounts, use `initial={entryPlayed ? false : { ... }}` to preserve the current state while avoiding redundant entry deltas.

## 7. `useReducedMotion`

This project imports `useReducedMotion` from `@app/motion` (not directly from `framer-motion`). The shared hook normalises the value across SSR and handles the `null` initial state.

Always check `prefersReducedMotion` and short-circuit to instant/static state — never skip this.

## 7. Verification

- [ ] No inline `whileHover` lift (`y: -1`, `scale: 1.02`) on standard controls — use background-layer expansion instead
- [ ] All `whileInView` elements have a `noMotionVariants` fallback or `useReducedMotion` guard
- [ ] `layoutId` values are unique and `y` is stripped from `transformTemplate` when the element is scroll-driven
- [ ] Overlay/media `layoutId` proxies disarm after the transition and do not block idle source interactions
- [ ] No GSAP inline styles on elements that also use Framer Motion `MotionValue`


---

## Orchestration Circularity (Function Declarations over useCallback)


## Overview
In complex Framer Motion components (like `TestimonialDeck`), multiple state-driven phases (idle -> committing -> settling) often require circular logical references.
Implementing these with `const` and `useCallback` triggers **Temporal Dead Zone (TDZ)** errors because `useCallback` dependencies are evaluated in sequence, and a `const` cannot be referenced as a dependency before its point of definition.

## Standard Pattern
When internal orchestration logic requires circularity (e.g., `finalizeSettle` -> `scheduleQueuedNavigation` -> `playDotAdvanceLeadIn` -> `commitDismiss` -> `finalizeSettle`):

1. **Revert to Function Declarations**: Use the `function` keyword for the core orchestration functions.
2. **Leverage Hoisting**: Function declarations are hoisted, allowing them to safely reference each other throughout the component body without TDZ errors.
3. **Internal stability**: If reference stability for children is required AND logic is circular, wrap the *entry point* (e.g. `handlePan`) in a `useCallback` that calls the internal hoisting-aware functions.

## Rationale
Prevents runtime `ReferenceError` crashes during component initialization while maintaining the ability to build complex, multi-phase animation state machines.

## Example
```tsx
// ❌ FAILS with TDZ if finalizedSettle references scheduleQueuedNavigation
const finalizeSettle = useCallback(() => {
  scheduleQueuedNavigation();
}, [scheduleQueuedNavigation]);

const scheduleQueuedNavigation = useCallback(() => { ... }, []);

// ✅ SUCCEEDS due to hoisting
function finalizeSettle() {
  scheduleQueuedNavigation();
}

function scheduleQueuedNavigation() {
  // logic...
}
```

// WHY: Reverting to function declarations is the high-craft solution for circular internal logic in large components when reference stability for child components can be managed by higher-level entry-points.
