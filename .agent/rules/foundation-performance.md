---
trigger: model-decision
description: Consult before adding fonts, images, hero/intro animations, route-level code, or bundle-affecting imports, and before acting on Lighthouse findings — font/image optimization, lazy loading, layout-thrash avoidance, mobile/desktop split, prefetching.
tier: kind:app
domain: performance
---

# Performance Foundations

> **Related Knowledge Base:** the project's performance spec (Lighthouse metrics, mobile platform
> split, lazy loading) — path in `project-invariants.md`.

Standards for maintaining high performance and low latency.

## 1. Font Optimization
*   **Variable Fonts:** NEVER import the full variable font range (e.g., `wght 100..900`).
*   **Axis Restriction:** Always restrict variable axes to the exact values needed (e.g., `opsz,wght@24,400`).
*   **Self-Hosting:** All third-party web fonts MUST be self-hosted and preloaded through the project's font pipeline (e.g., in a Next.js app, `next/font`; module path in `project-invariants.md`). Never inject a font provider's CSS at runtime via `<link rel="stylesheet">`. Runtime injection adds a serialized critical-path chain (HTML → boot script → provider CSS host → font-file host) that costs 250–340 ms per font on mobile. Self-hosting collapses that chain to one same-origin request and enables auto-preload.
*   **Fallback Chain Preservation:** When migrating an existing font into a self-hosting pipeline, keep the manual CSS fallback chain (e.g., `"Iowan Old Style", Georgia, serif`) instead of letting the tool substitute a metric-adjusted system fallback (e.g., in Next.js, `adjustFontFallback: false`). This preserves the existing FOUT silhouette.
*   **Display:** Check `swap` or `block` strategies to prevent layout shifts (CLS).

## 2. Image Optimization
*   **CDN Parameters:** Use URL parameters (e.g., Unsplash `w`, `q`, `auto=format`) to request optimized assets.
*   **Responsive Delivery:** ALWAYS implement `srcset` and `sizes` for grid/listing images to deliver appropriate resolutions for device DPI.
*   **Fetch Priority:** Use `fetchPriority="high"` (or the lowercase `fetchpriority` attribute where the framework requires it) for LCP images.

## 3. Bundle Size
*   **Server-Rendered by Default:** In frameworks with a server/client component split, page-level surfaces SHOULD render server-side unless they own client state at the top level. Wrap any required interactive concern (animation orchestration, gesture handling, motion-context hooks) in a thin client island that takes `children: ReactNode` and attaches behavior via refs — the page tree stays server-rendered; only the orchestrator is a client component. WHY: this pattern dramatically reduces mobile hydration cost. (The project's canonical island example is named in `project-invariants.md`.)
*   **Lazy Loading:** Route-level components MUST be lazy-loaded (e.g., `React.lazy` or the router's dynamic `import()` mechanism).
*   **Below-Fold Heavy Components:** Deferred-load client components that live below the fold and aren't part of the LCP element, using the framework's dynamic-import mechanism (e.g., `next/dynamic` in Next.js). Keep server rendering ON for the deferred chunk so the HTML still SSRs — preserves SEO and prevents CLS. Precedent components for this pattern are listed in `project-invariants.md`.
*   **Per-Page Image Preload:** Components shared across routes where the same element is above-fold on one route and below-fold on another MUST gate image `priority`/preload on a per-call prop. Default the prop to `false` (the safer choice) and have routes opt in.
*   **Import Cost:** Avoid importing entire libraries for single utility functions.
*   **Workspace `sideEffects`:** In a monorepo, every workspace package MUST declare a `sideEffects` field in its `package.json` so bundlers can tree-shake unused exports. Illustrative shapes:
    - A UI or theme package whose only side effects are stylesheet imports: `["**/*.css"]`.
    - A motion package with a plugin-registration file: `["**/*.css", "**/<plugin-registration-file>"]`.
    - A pure-data package with no CSS: `false`.
    When adding a new package, set `sideEffects` from the start. When adding top-level side-effect code (e.g., a plugin registration), add the file path to the package's `sideEffects` array.

## 4. Route Prefetching
*   **Utility:** a route-prefetch utility module maps route paths to `import()` functions with a `Set` tracking already-prefetched routes.
*   **Trigger:** Wire it to primary navigation links via `onMouseEnter` + `onFocus` — chunks download during hover dwell time before navigation.
*   **Combination:** Pair with a transition mechanism that keeps the current page visible during the lazy load (e.g., React's `startTransition`, or the router's equivalent opt-in) and the project's page-transition component.
*   **Result:** After first hover, subsequent navigation to that route is instant — no skeleton flash.

## 5. Avoiding Layout Thrashing (Reflows)
*   **Properties to Avoid Animating:** NEVER animate properties that trigger a browser layout/reflow if they can be avoided. This includes `fontWeight`, `width`, `height`, `margin`, `padding`, and `stroke-width` in complex SVGs.
*   **The 16ms Rule:** Any operation triggering a reflow longer than 16ms will cause frame drops. For premium cinematic feels, aim for 0ms reflow by using `transform` (GPU accelerated) and `opacity`.
*   **Weight Toggling:** When animating text emphasis, use a static CSS toggle or `style` flip for `fontWeight` rather than an animation-library tween, which would trigger layout measurements on every frame.

## 6. Mobile / Desktop Platform Split
*   **Principle:** Mobile ships a calmer, statically-rendered experience. Desktop runs the full cinematic intro. Adding a new cinematic animation to any hero surface MUST consider whether it runs on mobile. (The project's exact breakpoint and per-surface split are recorded in `project-invariants.md`.)
*   **Mobile Short-Circuit:** Hero and header intro sequences early-return on mobile before any JS-driven hide runs, so the server-rendered content stays visible from first paint. Any completion flags the intro would have set (e.g., a "header ready" state) must fire immediately on the mobile path.
*   **Reveal-Class Safety:** Any element hidden by a JS-driven reveal class on a mobile-visible surface must EITHER have its visibility cleared by a runtime animation call, OR rely on a mobile media-query override that resets it to visible. Do not add new uses of the reveal class to mobile-visible DOM without confirming one of these paths covers it. (The project's reveal-class name and override location are in `project-invariants.md`.)
*   **WHY:** JS-gated hero visibility is a dominant mobile LCP contributor (observed gating LCP at ~6 s). Keeping server-rendered content visible from first paint typically halves LCP without changing the desktop experience.

## 7. What NOT to Optimize
*   **Hover Transitions on Mobile:** Lighthouse may flag `transition: color`, `transition: background-color`, `transition: border-color` on hover states as "non-composited animations." These don't fire on mobile (no hover). Switching them to composited (transform/opacity) equivalents adds complexity without practical mobile gain. Treat the heuristic as advisory, not a fix list.
*   **Aggressive `priority` on Below-Fold Images:** On any given page, only the LCP candidate should carry `priority`. Below-fold images compete for preload bandwidth with the LCP element. If a component is shared across routes where the same element is above-fold on one route and below-fold on another, gate `priority` on a per-page prop rather than always passing it (see Section 3).

## 8. Verification
*   **Payload Check:** Verify font and image payload size in Network tab.
*   **Prefetch:** Hover navigation links in DevTools Network tab — verify chunk requests fire on hover, not on click.
*   **Lighthouse Variance:** Mobile Lighthouse score varies up to ±9 points across runs (TBT and SI are especially noisy). Treat any single-run regression as suspect; require an average across multiple runs (or a clear deploy delta in FCP/LCP) before drawing conclusions.
