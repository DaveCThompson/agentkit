---
trigger: model-decision
description: Consult before writing Framer Motion animations — import surface, scroll reveals, layoutId animations, page transitions, scroll-linked values, useReducedMotion.
tier: tech:framer-motion
domain: motion
---

# Framer Motion Patterns

Use the installed Motion/Framer Motion version and actual project motion contract. Preserve
geometry, state and accessible endpoints through interruption and navigation. Consult
`pattern-motion.md` when GSAP also participates; no local wrapper is supplied by this kit.

## 0. Import Surface

Discover package versions, exports and the project's import boundary. Use an existing shared
motion package if it owns required variants or lifecycle behavior. `@app/motion` is one possible
local alias, not mandatory infrastructure. Direct imports from the installed library are valid;
current Motion documentation uses `motion/react`, while older projects may use `framer-motion`.
Do not migrate packages or replace a compatibility wrapper just to match the newest example.

Follow the compiler/linter's type/value import conventions. Merging redundant imports is useful,
but a fixed import count or a global grep cannot prove the actual module contract.

## 1. When to Use Framer Motion

Motion offers gesture feedback, in-view reveals, shared/layout transitions, presence and scroll
values. Choose among these and existing CSS/browser/GSAP methods by required behavior and cost.
Do not add a second library merely because an effect is a timeline, reveal or page transition.

## 2. Scroll Reveals (`ScrollReveal`)

Reuse an existing reveal wrapper when its trigger, layout and lifecycle fit. Inline `whileInView`
is also valid. Once-only versus repeat and vertical versus horizontal movement are design choices.
Keep meaningful content reachable if startup or a visibility gate fails. Check the real reduced-motion
path before hiding content; skipped motion still needs its visible endpoint and completion state.
A wrapper can change grid/flex geometry, so inspect the rendered container.

## 3. Layout Animations (`layoutId`)

Shared elements intentionally use matching `layoutId` values. Prevent accidental collisions among
unrelated groups, using `LayoutGroup` namespacing where supported; do not require every matched
source/destination to have a different ID.
See [Motion layout animations](https://motion.dev/docs/react-layout-animations).

- Establish a usable source/destination box for shared media transitions. Reserve async image/content
  geometry and inspect first-open, repeat-open and close paths before adding measurement workarounds.
- Keep a required source measurement available through the transition. A fixed proxy can help for
  clipped/reused tracks, but only when native scroll/fixed layout support does not fit.
  Give a proxy a bounded opening/closing lifetime and keep it from duplicating accessible content,
  intercepting idle input or surviving teardown.
- Use installed `layoutScroll`/`layoutRoot` support when relevant to scroll/fixed measurement.
  Trace parent transforms and coordinate spaces before removing a transform axis.
- A custom `transformTemplate` must preserve every transform needed by the chosen layout model.
  Stripping `y` is a local workaround only when the verified contract excludes vertical movement;
  it is not a general cure for scroll-driven geometry.

## 4. Page Transitions (`PagePresence`)

Inspect the real route wrapper, keys, mount policy and entry-animation owners. An inert wrapper,
retained tree or keyed `AnimatePresence` may all be intentional. Changing keys resets component
identity and can cancel state/timelines; preserve or rebuild them according to navigation semantics.
Do not assume a component named `PagePresence` is a plain div or globally forbid page enter/exit.

For presence animations, check stable child keys, the actual presence boundary and retained exiting
content. Avoid duplicate focusable page regions and complete exit cleanup. A CSS opacity transition
can fit a retained wrapper, but it does not guarantee router children or GSAP timelines survive.
See [AnimatePresence](https://motion.dev/docs/react-animate-presence).

## 5. Scroll-Linked Values (`useScroll` + `useTransform`)

Assign each element/property/lifetime an owner. GSAP and Motion both writing inline styles is a
competing-writer problem, not a permanent specificity advantage for one library.
Use separate wrappers, composed source values/CSS variables, or an explicit handoff.
A CSS-variable proxy is not automatically observable by `useTransform`: connect actual reactive
inputs/subscriptions and clean them up rather than expecting computed CSS to trigger Motion.

Different properties may map the same scroll progress to different ranges, for example geometry
finishing before material color. Derive those ranges from the intended scene and verify resize,
scroll containers and interruption; fixed fractions are examples, not required timings.
Follow `foundation-performance.md` for measured rendering cost.

## 6. Motion Initialization (`initial`)

Choose an initial state when an entrance is intended. Motion permits `initial={false}` to skip
initial animation; not every animated property needs an explicit initial prop to avoid warnings.
Check server/initial-client consistency and visible startup/failure paths.
An `entryPlayed` gate can suppress repeat entrances, but its storage/lifetime must match navigation
and preference changes. `initial={false}` does not by itself preserve state across remounts.
See [motion component](https://motion.dev/docs/react-motion-component).

## 7. `useReducedMotion`

Use the real library hook or project wrapper and inspect its SSR/initial/preference-change behavior.
Choose a static or reduced-motion alternative that preserves content, feedback and completion;
do not equate “skip” with leaving the element hidden or removing necessary state transitions.
A setting can disable transform/layout animation while opacity still changes; check what the actual
configuration covers. See [useReducedMotion](https://motion.dev/docs/react-use-reduced-motion)
and `foundation-accessibility.md`.

## 7. Verification

- [ ] Import/API choices resolve in the installed version and preserve existing wrapper contracts.
- [ ] Reveals settle visibly on playback, skip, preference change, interruption and failed gates.
- [ ] Shared IDs match intended elements without cross-group collisions; geometry remains correct.
- [ ] Proxies, subscriptions, timers and exiting nodes clean up without reviving loops or stealing focus.
- [ ] Route mount/key behavior and cross-driver property ownership match the accepted design.
- [ ] Browser evidence supports visual claims; missing runtime/consumer checks remain unverified.

<a id="orchestration-circularity-function-declarations-over-usecallback"></a>

## Orchestration circularity and callback lifetime

## Overview

A callback body can refer to a later declaration if it executes after initialization. An eagerly
evaluated dependency array cannot read a later `const` in its temporal dead zone.
That distinction matters when settling/queued navigation phases refer to each other.

## Standard Pattern

For genuinely circular local logic, hoisted function declarations can avoid declaration-order
errors. Prefer a clear state machine or ordered pure transition functions when that simplifies the
flow. Hoisting does not bound recursion, cancel asynchronous work or make closures current.

Functions declared during render get new identities. A memoized entry point with omitted dependencies
can still capture stale functions/state. Choose dependencies or a version-appropriate current-value
mechanism deliberately; test queued callbacks across rerenders and teardown rather than silencing lint.

## Rationale

Separate initialization safety from callback identity and lifetime. Circular phases need a bounded
transition/queue policy, with completion and cancellation handled explicitly. Do not assume
`useCallback` is universally required or harmful.

## Example

This JavaScript-only example isolates declaration-order semantics; it is not a React lifecycle test.

```javascript
function unsafeDependencies() {
  const finalize = () => schedule(); // Deferred reference alone is not the failure.
  const dependencies = [schedule]; // Throws before schedule is initialized.
  const schedule = () => 'scheduled';
  return { finalize, dependencies };
}

function createController() {
  function finalize() { return schedule(); }
  function schedule() { return 'scheduled'; }
  return { finalize, dependencies: [schedule] };
}
```

Verify that calling `unsafeDependencies()` throws `ReferenceError` and that
`createController().finalize()` returns `'scheduled'`. Separately test real hooks, current-state
reads, queue termination and disposal in the consuming app under `foundation-testing.md`.
