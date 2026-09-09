---
trigger: model-decision
description: Consult when touching PWA concerns — virtual keyboard handling, offline detection, install experience, manifest standards, service-worker update mode, cache security, binary persistence.
tier: tech:pwa
domain: transport
---

# PWA Foundations

Preserve usable startup, offline work and safe upgrades on the actual supported browsers.
Discover the framework, service-worker scope, storage ownership and product contract; PWA
selection does not require a particular React hook, plugin, shell or installation experience.

## 0. Virtual Keyboard Handling (Solution B)

- Test the target browser/WebView's layout and visual viewport behavior. On supporting browsers,
  `interactive-widget=resizes-content` is an opt-in resizing strategy, not an Android-wide mandate.
  See [Chrome's viewport behavior](https://developer.chrome.com/blog/viewport-resize-behavior/).
- Preserve focused-field visibility, scrolling and accessible zoom. Safari panning, stable viewport
  units and visual-viewport adjustments are alternative techniques with different tradeoffs.
  `100svh` alone does not prove a control is above an overlay keyboard.
- If inferring keyboard presence from viewport changes, distinguish editable focus, keyboard,
  browser chrome and pinch zoom. A local `useVisualViewport` or data-attribute bridge is optional;
  combining editing intent with a keyboard signal can avoid hiding chrome during unrelated resizes.
- Hide footer/chrome only when the product calls for it, retaining essential actions and focus.
  A transform can animate the transition, but offscreen elements may remain focusable. Own the
  visibility/input state and respect reduced motion; measure cost rather than assuming acceleration.

## 1. Offline Detection

Use a shared connection abstraction if present, but distinguish network hints from successful
service access. `navigator.onLine` is unreliable for Internet/API reachability; see
[HTML system state](https://html.spec.whatwg.org/multipage/system-state.html).
Keep cached, stale, unavailable and retrying states distinct. Announce meaningful changes through
an appropriate status region without repeated noise. Persistent banners, slide animations and a
particular stacking tier are choices based on task impact, not universal requirements.

## 2. Install Experience

Use progressive enhancement for the actual browser's install affordances. If `beforeinstallprompt`
is supported, retain the event through an owned listener and invoke the prompt from the required
user interaction. Handle unavailable, dismissed and already-installed cases.
An existing toast or headless prompt can fit, but do not suppress useful native UI or force a
persistent prompt for every visit. Provide accurate platform instructions when appropriate.

## 3. Manifest Standards

Provide stable application identity appropriate to its deployment. Do not assign `id: "/"`
to every app sharing an origin. Preserve installed identity during URL changes and check
`start_url`, scope, names, icons and supported display behavior together.
Shortcuts, categories and `display_override` are optional capabilities; verify actual targets,
fallbacks and window-controls-overlay layout before enabling them.
See [Web App Manifest](https://www.w3.org/TR/appmanifest/).

## 4. Service Worker Update Mode

Choose waiting/prompted or automatic activation from compatibility, unsaved work and recovery needs.
`skipWaiting()` can place a new worker over an old loaded page; `clients.claim()` can take control
of clients that loaded without it. Neither guarantees a safe crash repair.
Registration is asynchronous and an early side-effect import does not guarantee control before
hydration. Test startup and controller-change ordering with the actual plugin/framework.

Preserve required app-shell/chunk/schema compatibility across supported old versions and multiple
tabs. Provide an update/reload recovery path that remains usable if normal application UI fails,
without assuming forced takeover is always correct. Do not reload away unsaved work silently.
See [service-worker lifecycle](https://web.dev/articles/service-worker-lifecycle).

## 5. Cache Security

Do not cache sensitive responses by default. Explicit offline-private-data requirements need a
threat model, user/tenant isolation, logout/revocation policy and retention/recovery checks.
Cache Storage is origin-scoped: a legacy-cache cleanup must identify owned entries and required
preservation before authorized deletion. A name such as `api-cache` alone proves neither ownership
nor safe cleanup. Apply `pattern-external-mutation.md`; registration is not a deletion grant.

Choose precache/runtime strategies, cache keys, limits and expiry for the actual resources.
Version-sensitive model/WASM/worklet/JS assets may need coherent versions; stale-while-revalidate
and cache-first are not interchangeable. Measure size/quota and update behavior instead of imposing
8-entry/30-day voice caches or universal precache exclusions.

## 6. Binary Data Persistence

Persist the binary data or a durable authorized reference, not a `blob:` URL as its durable identity.
Use IndexedDB or another existing suitable store; Dexie and `usePersistedImage` are optional
abstractions. Create object URLs when needed and revoke them after their last consumer is done,
not before a download/view has finished.

For valuable offline data, consider a contextual persistent-storage request and inspect its result.
It can be denied and does not protect against user deletion, XSS or lost credentials. Keep secrets
under `foundation-security.md`, not a compulsory browser-persistence scheme. A storage-status UI
is useful when the user can act on it, not an obligatory feature.
See [Storage Standard](https://storage.spec.whatwg.org/).
When the schema changes, test supported legacy upgrades, quota failures and interrupted writes.

## 7. Verification

Use actual project build/serve commands and target-browser install/service-worker tools; do not
invent `npm run preview` or assume an available Lighthouse PWA score. Identify tool version,
audits and scope. Generic performance/accessibility scores are not offline/update proof.

Test relevant fresh install, reload, offline navigation, network recovery, old-to-new worker,
multi-tab/unsaved-work and failed startup paths. Verify persisted binaries survive reload and
handle storage denial/eviction and schema upgrades. Use isolated owned profiles/data for destructive
cache tests; missing devices or service-worker runtime checks remain unverified.

## 8. Media & Hardware (Mobile Strictness)

Start user-activation-sensitive playback/audio work from the actual user interaction without
unnecessary intervening work. There is no universal “first tick” lifetime for all hardware APIs.
Handle `AudioContext.resume()` and media permission outcomes explicitly; a resolved stream and a
running audio context are separate states. Do not require constructing an analyser before every
`getUserMedia` call.

Request audio constraints for the product's capture quality and supported devices. Automatic gain
control can be useful for speech and undesirable for other audio; inspect support/settings instead
of always enabling it. Starting a visualizer does not arbitrate exclusive hardware access between
MediaRecorder and AudioContext. Share or isolate streams deliberately, handle interruption/denial
and stop owned tracks, loops and contexts at the appropriate lifetime.
See [Web Audio](https://webaudio.github.io/web-audio-api/) and
[Media Capture](https://www.w3.org/TR/mediacapture-streams/).
