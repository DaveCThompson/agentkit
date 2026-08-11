---
trigger: model-decision
description: Consult before writing GSAP animations — hybrid motion architecture, CSS variable proxies, SplitText reveals, timeline orchestration, FOUC prevention, reduced-motion handling.
tier: tech:gsap
domain: motion
---

# GSAP Motion Patterns

> **Related Knowledge Base:** docs/knowledge-base/SPEC-motion.md (motion principles, GSAP timelines, GSAP/CSS coexistence).

GSAP-specific rules for high-fidelity timelines, SplitText, TextPlugin, ScrollTrigger, and GSAP/CSS coexistence. For Framer Motion usage rules see `pattern-framer-motion.md`.

## 1. Hybrid Motion Architecture
*   **GSAP**: Mandatory for complex, timeline-based cinematic scenes, text manipulation (SplitText), and choreographed intro sequences.
*   **Conflict Prevention**: GSAP animations must use a local `scope` (use `useGSAP`) to avoid selector collisions with Framer Motion elements.

## 2. CSS Variable Proxy (Critical for Dual-Driver Elements)
*   **Rule**: When an element is driven by *both* a GSAP intro timeline and Framer Motion scroll values, GSAP must **never** write inline `opacity`, `width`, `visibility`, or `transform` directly. These inline styles override CSS expressions permanently.
*   **Pattern**: Tween a CSS custom property (`--my-progress: 0 → 1`) and let CSS `calc()` or `var()` consume it alongside the scroll-driven variables.
*   **Reference**: See `.agent/skills/gsap-css-layout/SKILL.md` for the complete catalog.

## 3. Text Reveal (SplitText)
*   **Masking**: Characters must be wrapped in `overflow: hidden` containers (`charsClass: 'gsap-char-inner'`, `wordsClass: 'gsap-char-outer'`).
*   **Descender Clipping Fix**: 
    *   Masked containers for text with descenders (`g`, `y`, `p`, `q`, `j`) MUST include `padding-bottom: 0.12em` and a matching negative `margin-bottom` to prevent glyph clipping.
*   **Cleanup**: Always call `split.revert()` or ensure the component unmounts cleanly to prevent DOM pollution.

## 3a. Per-Target Parallelism with `parent.add(child, 0)`

When N targets each need their own multi-step sequence and **all sequences should run in parallel**, build one **child timeline per target** and add each at parent position `0`. Do NOT chain `.to()` calls for multiple targets on a single shared timeline.

The default position parameter for an unpositioned `.to()` is `+=0` from the **end of the timeline**, not "after the previous tween for this target." Chaining per-target tweens on a shared timeline therefore appends each target's later steps after every prior target's final step, ballooning the timeline duration to `O(targets × steps × stepDuration)` and pushing return-to-rest tweens far into the future.

```ts
// CORRECT — parallel per-target sequences
const parent = gsap.timeline();
targets.forEach((t) => {
  const child = gsap.timeline({ delay: gsap.utils.random(0, 0.1) });
  child.to(t, { ...step1 }).to(t, { ...step2 }).to(t, { ...step3 });
  parent.add(child, 0);
});
return parent; // total duration ≈ delay + sum(stepDurations)

// INCORRECT — sequential cascade across all targets
const tl = gsap.timeline();
targets.forEach((t) => {
  tl.to(t, { ...step1 }, gsap.utils.random(0, 0.1)) // absolute position
    .to(t, { ...step2 })  // appends to end of timeline (after every prior target)
    .to(t, { ...step3 }); // appends to end of timeline
});
return tl; // total duration ≈ targets × stepCount × stepDuration
```

Before queuing a new sequence on a target, call `gsap.killTweensOf(el, 'attr')` (or the relevant property string) to clear in-flight tweens from other systems (hover, sparkle, etc.) that would otherwise fight the new animation. Keep any module-level "currently displaced" trackers in sync — clear them when the sequence resets dot positions.

## 4. Orchestration
*   **Staggers**: Use small staggers (`0.01s - 0.04s`) for character/item-level motion to maintain a premium "brushed" feel.
*   **Easing**: 
    *   Cinematic entries: Use `expo.out` or `power4.out`.
    *   Crisp sequential fire (staggered UI): Use `power3.out` — **mandatory** for nav links, control icons, list items.
    *   **Prohibited for staggers**: `back.out()` and `elastic.out()` — these overshoot and cause visible wobble in sequential sequences.
*   **Unified arrays**: When items span multiple containers (e.g., nav links + control icons), concatenate into a single array for one unbroken left-to-right stagger.

## 5. FOUC Prevention + Gated Entry (Single Hook Rule)

**Use one `useGSAP` hook — never two** when combining initial hide with a gated animation. Two hooks create separate GSAP contexts with separate cleanup cycles. In React Strict Mode the cleanup gap between them produces a rendered frame where elements flash visible, causing a "partial fade, then restart" double-animation glitch.

```tsx
// CORRECT: single hook
useGSAP(() => {
  gsap.set(targets, { opacity: 0, y: 28, visibility: 'hidden' });
  if (!isGateOpen) return;
  gsap.to(targets, { opacity: 1, y: 0, visibility: 'visible', duration: 0.82 });
}, { scope: ref, dependencies: [isGateOpen], revertOnUpdate: true });

// INCORRECT: two hooks — double-animation glitch in Strict Mode
useGSAP(() => { gsap.set(targets, { opacity: 0 }); }, { scope: ref });
useGSAP(() => { if (!isGateOpen) return; gsap.to(targets, { opacity: 1 }); }, { scope: ref, dependencies: [isGateOpen] });
```

### CSS initial state + data-attribute override (SSR-safe pattern)

For components that must survive SSR hydration with content already hidden, pair a CSS module rule with a data-attribute override instead of relying solely on `gsap.set`:

```css
/* Default: hidden for animation */
.root :global([data-hero-reveal]) { opacity: 0; visibility: hidden; }

/* Override: visible when animation is skipped (higher specificity wins) */
.root[data-hero-revealed='true'] :global([data-hero-reveal]) { opacity: 1; visibility: visible; }
```

Set `el.dataset.heroRevealed = 'true'` in the immediate-visible path (reduced motion, post-intro navigation, tween complete). This ensures elements are visible via CSS alone even if the GSAP context is reverted, making the component resilient to timing edge cases.

*   For page hero entries on non-home pages, use the `HeroReveal` component — do not inline the GSAP logic per page.

### Client reveal wrappers: default-visible CSS + JS hide

For client-only ScrollTrigger reveal wrappers (e.g. `GSAPReveal`), do **not** hard-code `style={{ visibility: 'hidden' }}` in JSX. Default the container to visible in CSS and hide it via `gsap.set(el, { visibility: 'hidden' })` at the top of the same `useGSAP` callback (the one that builds the timeline). `useGSAP` runs in a pre-paint layout effect, so capable browsers still see no flash, while no-JS / JS-error visitors keep the content instead of being stranded behind a permanently invisible wrapper.

## 9. Page Entry Choreography (Three-Beat Rule)

Every page follows the same three-beat entry sequence. Do not deviate from this order.

**Beat 1 — Header** (~1.8s, fires immediately on mount)
The `AppHeader` GSAP timeline runs to completion and calls `setIsHeaderComplete(true)`.

**Beat 2 — Hero content** (gated on `isHeaderComplete`)
- Home: bespoke GSAP timeline — SplitText chars for heading, word-split for description, absolute positions `0`, `0.28`, `0.48` within the timeline.
- All other pages: `HeroReveal` component with `data-hero-reveal` targets on heading + body. Default stagger `0.15s`; increase to `0.25–0.30s` when a more sequential read is desired (e.g. Testimonials hero).

**Beat 3 — Page body content** (gated on `isHeaderComplete`, delayed past hero)
Wrap all below-hero page sections in a second `HeroReveal` with `delay={0.6}`. This ensures body content never appears before the hero text has landed.

```tsx
// Pattern for all non-home pages
<HeroReveal delay={0.6}>
  <div data-hero-reveal className={styles.pageContent}>
    {/* all below-hero sections */}
  </div>
</HeroReveal>
```

When multiple sections must each stagger independently (e.g. Testimonials), use one `data-hero-reveal` div per section and set an explicit `stagger` on the `HeroReveal`:

```tsx
<HeroReveal delay={0.6} stagger={0.2} className={styles.sectionsReveal}>
  <div data-hero-reveal><PageSection .../></div>
  <div data-hero-reveal><PageSection .../></div>
  <div data-hero-reveal><PageSection .../></div>
</HeroReveal>
```

**CSS requirement:** When a `HeroReveal` wrapper collapses multiple sections into one grid/flex item, the inner `data-hero-reveal` div must carry `display: grid; gap: var(--layout-section-gap)` (or flex equivalent) to preserve inter-section spacing. Add a page-local CSS class — do not inline the style.

**Grid matrix stagger:** Use `(index % columns) * stepSeconds` — never raw `index * step`. Raw index causes rows 2+ to have compounding delays (0.6s, 0.8s, 1.0s) that force users to scroll far before cards appear. Default: `(index % 3) * 0.15`.

## 6. `revertOnUpdate: true` for Reactive Dependencies

`@gsap/react` v2.1+ defaults to `deferCleanup = true` when `dependencies` are provided. This means each dependency change **adds** the callback to the existing GSAP context without reverting the previous run. Stale `gsap.set` calls, SplitText instances, and duplicate timelines accumulate until component unmount.

**Rule:** Any `useGSAP` with `dependencies` that include React context values, state, or props that can change more than once must set `revertOnUpdate: true`.

```tsx
useGSAP(() => {
  // Runs fresh on every dependency change — no accumulated stale animations
}, { scope: ref, dependencies: [isGateOpen, prefersReducedMotion], revertOnUpdate: true });
```

`revertOnUpdate: true` makes `useGSAP` behave like a standard `useLayoutEffect`: cleanup (context revert) runs before the new callback. Since `useGSAP` uses `useLayoutEffect` internally, the revert + re-run is synchronous before browser paint — there is no visible flash.

**Exceptions:** `useGSAP` calls with no dependencies, or with only static dependencies (e.g., `prefersReducedMotion` alone that never changes after hydration), have lower risk and may omit this flag.

## 6a. Killing Timelines Created Outside `useGSAP`

`useGSAP` only auto-reverts animations created **inside** its callback. One-shot timelines created in event handlers or non-GSAP effects (a click-triggered burst, a status-change shake/pulse) live outside any GSAP context and are never auto-cleaned.

**Rule:** Track every such transient timeline and kill it on unmount. If its `onComplete` re-arms a looping timeline (`repeat: -1`), guard the callback with an unmount flag — otherwise an unmount mid-animation spawns a forever-running timeline against detached DOM (a real leak a green build cannot catch).

```tsx
const transientTimelinesRef = useRef<Set<gsap.core.Timeline>>(new Set());
const isUnmountedRef = useRef(false);

function trackAndRearm(t: gsap.core.Timeline) {
  transientTimelinesRef.current.add(t);
  t.eventCallback('onComplete', () => {
    transientTimelinesRef.current.delete(t);
    if (isUnmountedRef.current) return;       // do not resurrect the loop after unmount
    loopTimelineRef.current = startLoop();
  });
}

useEffect(() => () => {
  isUnmountedRef.current = true;
  transientTimelinesRef.current.forEach((t) => t.kill());
  transientTimelinesRef.current.clear();
}, []);
```

## 7. Single Animation Owner Per DOM Region

Each DOM subtree must have exactly one component responsible for its entry animation. When two independent systems animate the same elements simultaneously (e.g., a route-level wrapper applying `opacity/y` while page-local GSAP does the same), the visible result is always a double fade, stutter, or blank flash.

**Rule:** If a page-level wrapper applies any entry animation, page-local components must wait for it to complete before starting their own. If pages own their own entry animations, the route-level wrapper must be visually inert (no opacity/transform on the page container).

Current contract:
- `PagePresence` is a plain `<div>` wrapper — no animation. Pages own their entry animations exclusively.
- If route-level cross-fade is added in the future, it must use a CSS transition on a className toggle rather than `AnimatePresence` key-remount. Remounting kills in-flight GSAP timelines and forces HeroReveal to re-evaluate its gate on every navigation.

## 8. PagePresence + GSAP Coexistence (Updated)

`PagePresence` is currently a plain `<div>` — it applies no animation. Page-local GSAP timelines (HeroReveal, Home page timeline) are the sole animation owners.

If a cross-fade is added in the future, do NOT use `AnimatePresence` + `key={pathname}`. That pattern unmounts the old page component tree, killing all in-flight GSAP timelines and forcing HeroReveal to re-evaluate its gate. Instead, toggle a CSS class on the PagePresence container and let `transition: opacity` handle the cross-fade without any remount.

## 7. Grid Safety with GSAP
*   When GSAP toggles `display: none` on grid children, ALL grid children must have explicit `grid-column` assignments to prevent auto-placement drift.
*   Grid `gap` must scale with the expansion proxy when the container starts below the gap threshold.

## 8. Cinematic Accessibility
*   **The Reduced-Motion Mirror**: Every cinematic sequence must have a static or high-utility fallback. Do not delete content under reduced motion; reveal it instantly or via a 0.4s opacity fade only.
*   **Hydration Safety**: Use CSS-driven initial states (`opacity: 0`, `visibility: hidden`) and only trigger transitions after mount confirmed user preferences to prevent "Motion Flash".
*   **Safe-Contrast (AA)**: Premium surfaces (Glass, Blurs) must meet WCAG 2.1 AA (4.5:1). When `prefers-reduced-motion` is active, Glass surfaces must increase background opacity to reduce visual noise.
*   **Focus Continuity**: Complex 3D components (e.g., Testimonial Deck) must implement explicit identity-binding for focus. When a top item is dismissed, focus must be programmatically moved to the incoming item's container.

## 10. Typing and Content Rotation

- **Proxy-Only Backspacing**: For any typewriter 'delete' or 'clear' phase, NEVER use `TextPlugin` heuristics with `text: ''`. You MUST use the **Proxy Property Animation** pattern (animating a numerical `len` property and updating `innerText` via `substring(0, len)`) to guarantee character-by-character reduction from the right.
- **Alignment Stability**: Dynamic text containers MUST use `justify-content: flex-start` or `text-align: left` to prevent horizontal "sliding" when content length fluctuates.
- **Aria-Live Continuity**: Rotating text elements MUST use `aria-live="polite"` and `aria-atomic="true"` to ensure screen readers announce updates without interrupting the user.

## 11. Verification
- [ ] **Scroll coexistence**: No stale GSAP inline styles on scroll-driven elements after timeline completes.
- [ ] **Accessibility**: All motion timelines check `prefers-reduced-motion` and implement the "Mirror" policy.
- [ ] **Hydration**: Component initial states are CSS-driven to prevent flash.
- [ ] **Performance**: GSAP timelines use `useGSAP` for automatic lifecycle management.
- [ ] **Grid**: Explicit `grid-column` on all children when any sibling toggles `display`.
- [ ] **Typing**: Backspace animations use the Proxy Property pattern (no left-deletion).
