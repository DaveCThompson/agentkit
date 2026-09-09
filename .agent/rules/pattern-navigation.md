---
trigger: model-decision
description: Consult when adding menus, tabs, routes or scroll behavior — route identity, active state, compatible URLs, scroll restoration and framework-specific loading boundaries.
tier: kind:app
domain: layout
---

# Navigation Patterns

Preserve route identity, browser navigation and the project's wayfinding contract. Reuse actual
router and menu APIs; visual conventions and scroll policies are not universal framework rules.

## 1. Menus & Dropdowns

- Use established spacing, radii and state tokens. Concentric container/item geometry is useful,
  but menu sizes depend on borders, padding, content and target requirements.
- Distinguish navigation lists, disclosure menus and composite menu widgets. Preserve naming,
  keyboard operation, dismissal and focus return for the chosen pattern.

## 2. Routing & URL State

- Derive route-active state from the actual router/location for bookmarkable navigation.
  `useLocation()` is one API; local state remains appropriate for transient non-route controls.
- Use `aria-current` where it identifies the current page/location. Classes or data attributes are
  styling mechanisms, not substitutes for accessible state or a mandated selector spelling.
- Match loading/error boundaries to the router/framework. React lazy components need an applicable
  Suspense boundary; not every router's lazy route uses the same loading mechanism.
  Preserve useful shell content and provide failure/retry behavior, not a required `LoadingScreen`.

## 3. Scroll Management

- Discover the router's restoration and focus policy before adding effects. Preserve back/forward
  positions, hash destinations and nested scrollers. New-page top reset may be appropriate, but
  not on every mount or every parameter update.
- Diagnose animation-induced offsets against the measured scroll owner and layout. Do not add a
  universal `useLayoutEffect`/window reset that overrides restored state or focus.
- Respect reduced motion for smooth navigation. Choose instantaneous resets explicitly where the
  policy needs them; global `scroll-behavior: smooth` does not distinguish user from script calls.
  See [CSS scrolling behavior](https://www.w3.org/TR/css-overflow-3/#smooth-scrolling).

## 4. Semantic Slugs & Invariance

- Keep externally used IDs and URLs stable across reordering. Semantic slugs, database IDs and
  opaque identifiers can all be appropriate; an ordinal derived from current list position is fragile.
- Preserve existing compatibility links or plan redirects when a rename is authorized.
  Descriptive slugs are not necessarily immutable and must not expose private data.
- Retiring runtime content does not authorize deleting client-locked placeholders or published
  routes. Preserve explicitly required archive targets and links according to the project's
  retirement contract; coordinate redirects/removal rather than inferring them from UI absence.

## 5. Verification

### Invariants (Automated)

- Use actual route/link tests for stable identity, redirects, active state and loading/error paths.
  A search for `project-1` or `isActive` cannot establish a violation by spelling alone.
- Verify linked targets exist and required compatibility URLs still resolve.

### Logic (Manual/Reasoning)

- Exercise deep links, reload, back/forward, hash links, repeated navigation and relevant nested
  scrolling, including interrupted entry/exit motion.
- Check focus and active announcements after navigation. Report static coverage separately from
  browser restoration and rendering evidence under `foundation-testing.md`.
