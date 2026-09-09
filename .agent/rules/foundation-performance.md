---
trigger: model-decision
description: Consult before changing fonts, images, animations, route loading or bundle-affecting imports, and when investigating performance findings — measured delivery, rendering and responsiveness tradeoffs.
tier: kind:app
domain: performance
---

# Performance Foundations

Choose techniques from the measured bottleneck, supported environment and project budgets.
Preserve behavior, accessibility and recovery; technique adoption alone is not evidence of speed.
Use `foundation-testing.md` for comparable evidence and `audit-performance`/`performance-fix`
for the requested analysis or repair.

Read applicable project performance guidance, source/build configuration and runtime versions.
A design expectation or another project's measurement is a hypothesis for this application.

## 1. Font Optimization

- Inspect requested families, glyphs, weights, axes and actual transfer size. Compare variable
  fonts with the static faces needed by the design. Subset unused ranges when the delivery
  pipeline supports it; changing a CSS weight descriptor alone may not shrink the font file.
  Keep required languages and variable typography behavior.
- Prefer the existing font pipeline. Compare self-hosting and provider delivery using licensing,
  privacy, caching, connection setup and request discovery. Avoid late runtime stylesheet
  injection on the critical path when early discovery works. Do not require a particular framework
  loader or promise a fixed millisecond saving.
- Preload only fonts likely needed for initial content, using the correct resource/CORS settings.
  Check that the rendered face reuses the preload; unused preloads can compete with critical work.
- Choose `font-display` for readable fallback and acceptable font swapping. Neither `swap` nor
  `block` guarantees zero CLS. Compare fallback metrics, line breaks and layout after loading;
  preserve a contractual fallback silhouette or use metric adjustment when it improves the result.

See [font loading and rendering](https://web.dev/articles/optimize-webfont-loading).

## 2. Image Optimization

- Deliver appropriate dimensions, quality and format through the installed image pipeline/CDN.
  Use supported parameters, not assumed provider-specific query strings.
- Use responsive candidates (`srcset`/`sizes` or framework equivalent) when display width/DPI
  varies. Check selected resources at representative sizes; a small fixed icon need not acquire
  a redundant responsive pipeline. Reserve dimensions/aspect ratio to limit shifts.
- Identify likely LCP elements by page/state. Discover their resources early, avoid lazy-loading
  the LCP image, and consider `fetchpriority="high"` or framework equivalent where it advances the
  critical request. Avoid indiscriminate preload/priority on below-fold assets.

See [LCP resource discovery and priority](https://web.dev/articles/optimize-lcp).

## 3. Bundle Size

- Inspect emitted chunks, transfer, parsing/evaluation and hydration costs. Use documented package
  exports and verify tree shaking; a barrel import is not inherently a defect. Avoid unsupported
  internal `dist/` imports as an optimization shortcut.
- In frameworks with server/client boundaries, keep work server-side when it requires no client
  behavior and the boundary preserves the contract. Thin client islands can reduce shipped JS;
  respect serialization, context and state ownership. Do not mandate one ref-driven wrapper shape.
- Use the router/framework's existing splitting before adding `React.lazy` or dynamic imports.
  Defer expensive optional features when it improves initial loading. A lazy component mounted
  immediately loads immediately; splitting critical content can introduce a waterfall.
- Preserve required server HTML and stable fallback dimensions where the framework supports them.
  Code splitting, server rendering and visibility-triggered loading are distinct behaviors; inspect
  actual chunk requests. Include loading, disabled, empty, error/retry and stale-result handling.
  Suspense loading fallback alone is not chunk-error recovery.
- Shared image components need a per-use priority/loading choice when their placement differs by
  route. Use conservative defaults and opt into critical loading based on the actual page.
- Declare `sideEffects` only from a package's real module effects and the bundler's semantics.
  `false` asserts unused modules can be dropped, including their initialization. Retain stylesheet,
  polyfill and registration modules in accurate patterns when necessary. Do not mark every package
  side-effect-free or assume `["**/*.css"]` covers non-CSS effects. Verify a production consumer
  still loads required styles and initialization after tree shaking.

[Webpack's tree-shaking guide](https://webpack.js.org/guides/tree-shaking/) explains `sideEffects`;
other bundlers and package formats need their own supported contract.

## 4. Route Prefetching

- Prefer router-native prefetch and caching. Add intent prefetch on pointer hover or keyboard
  focus when likely navigation justifies bandwidth and memory cost. Consider cache/auth scope,
  constrained connections and discarded intent; prefetch must not trigger business mutations.
- If using a custom import map, share it with the actual loader, track in-flight/success states,
  observe rejections and define retry behavior. A Set of attempted routes must not turn a failed
  import into permanent apparent success. Prevent stale data from replacing newer navigation.
- Test cold/warm navigation and failed loads. A prefetched chunk does not guarantee instant
  navigation: data, evaluation, server work or rendering may remain.
- Transitions may preserve useful current content during loading. React `startTransition` changes
  update priority, not the execution cost of synchronous code in its callback. Move or break up
  measured CPU work through an appropriate strategy; see `react-performance` and its async reference.

## 5. Avoiding Layout Thrashing (Reflows)

- Use traces to distinguish scripting, style, layout, paint and compositing. Batch reads before
  writes where possible; avoid repeated forced layout from interleaved measurement and mutation.
- Prefer transform/opacity when they express the desired effect with less layout/paint work.
  Width, height, spacing, font changes and some SVG operations can remain necessary; measure
  affected layout and visual quality instead of banning the properties.
- CSS variables compose values; animating a variable consumed by width still changes layout.
  Transform/opacity are often compositor-friendly, not guaranteed GPU-only or free. Layer memory,
  rasterization, effects and the rest of the frame still matter.
- Frame budgets depend on refresh rate and all frame work; 16ms is not a universal pass/fail
  boundary. A static font-weight change can also relayout text. Choose a toggle versus tween
  from interaction intent and measured cost, preserving readable text.

See [browser animation performance](https://web.dev/articles/animations-guide).

## 6. Mobile / Desktop Platform Split

- Adapt effects to actual input, viewport, device capacity, preferences and measured cost. A
  calmer mobile presentation can be a valid project design; device class alone does not mandate
  a cinematic desktop/static mobile split. Keep required content and controls available.
- Leave essential server-rendered content visible until a reveal can start, or provide a bounded
  fallback for delayed/failed startup. Do not make meaningful content depend indefinitely on JS,
  a font request or a header-ready gate.
- Skip/reduced-motion paths must reach the intended visible state and settle required readiness
  signals. Distinguish completion from teardown; stale/unmounted controllers must not signal
  success or restart loops. Interrupt only owned properties.
- Check no-JS, gate failure, changed preference, resize and navigation interruption where relevant.
  A CSS mobile override helps only if it actually covers every hidden target at that breakpoint.
  See `pattern-motion.md` and the complete lifecycle example in `gsap-css-layout`.

## 7. What NOT to Optimize

- Treat audit heuristics as candidates. Corroborate non-composited hover/state transitions in the
  real interaction before restyling them. Touch devices may also have a mouse/keyboard or trigger
  focus/active changes; do not assume hover-related styles are universally irrelevant on mobile.
- Do not move costs off the measured screen while degrading other consumers, cache states,
  accessibility or failure recovery. Do not add memoization, prefetch, preloads or virtualization
  when their complexity/resource costs exceed the evidenced gain.
- Preserve no-change outcomes when performance already meets the actual requirement.

## 8. Verification

- Compare the same workload, build mode/version, device/throttling and cache state before/after.
  Record exact candidate identity, method and affected metric; repeat enough to resolve observed
  variance rather than importing a universal score range or fixed run count.
- Inspect network requests, selected font/image payloads, emitted chunks and actual initialization.
  Verify both successful loading and failure/retry/disabled/stale-result paths.
- Separate field LCP/INP/CLS from supporting lab metrics such as TBT. A Lighthouse score alone
  does not establish a causal improvement, field conformance or interaction responsiveness.
- Use browser/React profiling for applicable rendering claims. Record unmeasured source candidates
  and the missing method/owner when runtime evidence is unavailable.
