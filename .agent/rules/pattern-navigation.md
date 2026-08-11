---
trigger: model-decision
description: Consult when adding menus, tabs, routes, or scroll behavior — URL-first active state, semantic slugs (never ordinal IDs), scroll reset with entry animations, Suspense-wrapped lazy routes.
tier: kind:app
domain: layout
---

# Navigation Patterns

Rules for Wayfinding: Menus, Tabs, and Routing.

## 1. Menus & Dropdowns
*   **Spacing**: General Dropdowns (`4px` gap).
*   **Radii**: Menu Container Radius = Item Radius (8px) + Padding (4px) = 12px.
*   **Interaction**: Ensure hover states use the semantic `--control-bg-hover` token.

## 2. Routing & URL State
*   **URL First**: Always derive "Active" state from `useLocation()`, not local state.
*   **Visuals**: Use `data-active="true"` attribute selectors, not `.active` classes.
*   **Page Transitions**: For any lazy-loaded page route, ensure wrapping in `<Suspense>` with a consistent `LoadingScreen` component.

## 3. Scroll Management
*   **Initial Reset**: For pages with entry animations (e.g., `framer-motion` transforms), always use `useLayoutEffect` to explicitly `window.scrollTo(0, 0)` on mount. This counteracts browser/hydration offsets during the animation window.
*   **Behavior**: Set `scroll-behavior: smooth` in `globals.css` only for user-driven scrolling. Programmatic resets should be instantaneous.

## 4. Semantic Slugs & Invariance
*   **Immutable IDs**: Case study routes and navigational items MUST use semantic slugs (e.g., `circl-app`, `branding-system`), NEVER ordinal IDs (`work-1`, `project-2`).
*   **Ref Ordering**: Changing the order of items in a matrix should never require data migration or URL changes.

## 5. Verification

### Invariants (Automated)
- [ ] **Semantic Slugs**: `grep "project-[0-9]\|work-[0-9]" apps/<app>/` (Must use semantic slug naming).
- [ ] **URL-First Active States**: `grep "isActive" apps/<app>/` (Prefer `data-active` attribute selectors in CSS).

### Logic (Manual/Reasoning)
- [ ] **Scroll Reset**: Does navigating to a new page correctly start at the top despite exit/entry transforms?
- [ ] **Deep Linking**: Can users link directly to a specific work item within an index?
