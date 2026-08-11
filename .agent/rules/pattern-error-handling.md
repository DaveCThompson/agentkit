---
trigger: model-decision
description: Consult when building error, loading, or empty states, toasts, form validation, or network-error handling — ErrorState/EmptyState/Skeleton primitives, three-tier skeleton architecture, API data resilience.
tier: kind:app
domain: error-handling
---

# Error Handling Patterns

Standards for error states, loading states, and user feedback.

## 1. Error Boundaries
*   **Rule:** Wrap feature areas with React Error Boundaries.
*   **Fallback:** Use the shared `ErrorState` component as the fallback UI — never a blank screen.
*   **Reporting:** The boundary's catch hook reports to the project's error-telemetry service (e.g., Sentry) for production visibility.
*   **Logging:** Errors logged to console in development via the project's dev-logging instrumentation.

## 2. Shared UI Components

The project's shared-UI layer (location in `project-invariants.md`) owns three primitives. Never build ad-hoc equivalents.

### `ErrorState` (shared error-display component)
Unified error display replacing all ad-hoc page error states.
*   **Props:** `title`, `description`, `onRetry?`, `supportLink?`, `icon?`, `variant?: 'page' | 'section'`
*   **Retry:** Wire `onRetry` to the data layer's refetch for data-fetching pages.
*   **Token compliance:** All colors via semantic tokens — zero hardcoded values.

### `EmptyState` (shared empty-state component)
Unified empty display for "no data" scenarios.
*   **Props:** `icon`, `title`, `description`, `action?: { label, onClick }`
*   **Token Usage:** Uses `var(--text-tertiary)` for icon, `var(--text-secondary)` for description.

### `Skeleton` (shared loading-placeholder primitive)
Animated placeholder primitive for loading states.
*   **Variants:** `text`, `circular`, `rectangular` (via `data-variant`)
*   **Shimmer:** Neutral `color-mix(in oklch, var(--surface-bg-tertiary), white 15%)` — not brand-tinted.
*   **`@keyframes` co-location:** The shimmer animation MUST live in the component's own scoped stylesheet — CSS Modules scope keyframe names per file, so an animation referenced from another module silently fails.

## 3. Loading Architecture (Three-Tier Skeleton)

### Tier 1: HTML Shell (Pre-JavaScript)
*   The HTML entry document renders a minimal "Loading ..." screen before any JS executes.
*   Blocking `<script>` in `<head>` reads the persisted theme and sets `data-theme` on `<html>` before first paint.
*   Persistent `<style>` in `<head>` sets backgrounds for both light/dark modes — survives app mount.
*   **CRITICAL:** Never put `<style>` inside the root mount node — the framework's first render destroys it.
*   **CRITICAL:** Never use inline `style="background: ..."` for theme-aware properties — inline styles beat `<style>` selectors.

### Tier 2: App-Shell Skeleton (Auth Loading)
*   A full app-frame skeleton (sidebar + header + content skeleton) shown while the main layout chunk loads or during auth bootstrap.
*   Backgrounds match the real app shell (e.g., sidebar = `bg-secondary`, main = `bg-primary`) so the handoff is seamless.

### Tier 3: Per-Page Skeletons (Within the App Shell)
*   Each lazy-loaded page has a matching skeleton component, wired at the route table via the project's lazy-route helper.
*   Skeletons match their page's gaps, container widths, and layout structure.
*   **Spinners reserved for:** Inline/button contexts only — never full-page loading.

## 4. Toast Notifications
*   **Duration:** Success = 3s, Warning = 5s, Error = persistent until dismissed.
*   **Stacking:** Maximum 3 toasts visible; queue additional ones.
*   **Position:** Bottom-right for non-blocking; top-center for critical.
*   **Content:** Active voice, actionable. "Changes saved" not "Your changes have been saved successfully."

## 5. Form Validation
*   **Inline Errors:** Show errors adjacent to the invalid field.
*   **Error Styling:** Use the project's error tokens (see `project-invariants.md`) for error text and for invalid-field borders — via semantic tokens only, never hardcoded color values.
*   **Timing:** Validate on blur for new fields; on change for fields with existing errors.
*   **Error Clearing:** Clear error messages when user starts editing the field. Only clear error-tone messages, preserve success messages.
*   **Summary:** For complex forms, show error summary at top with links to fields.

## 6. Network Errors
*   **Retry Logic:** All data-fetching pages show `ErrorState` with a retry button wired to the data layer's refetch.
*   **Offline Detection:** An online-status hook triggers a warning toast on connectivity loss/recovery.
*   **Timeout:** Configure the shared HTTP client with a hard request timeout (e.g., 15 s). Prevents hung requests from blocking UI indefinitely.
*   **Telemetry:** The shared caught-API-error helper reports to the error-telemetry service. Disabled in dev, enabled in staging/production.
*   **Interceptor Boundary:** Shared API interceptors may normalize transport failures into typed app errors and handle auth redirects, but they MUST NOT fire generic user-facing error toasts for server/network failures by default.
*   **Feature Ownership:** Feature hooks and local handlers own contextual user messaging. The shared caught-error helper must understand normalized app errors so feature-specific fallback copy survives transport normalization.

## 7. Accessibility
*   **ARIA Live Regions:** Announce errors to screen readers with `aria-live="polite"`.
*   **Focus Management:** Move focus to first error field on form submission failure.
*   **Color Independence:** Don't rely solely on color; use icons and text.

## 8. Hyper-Defensive Component Wrappers
*   **Slot Triggers:** Headless-library slot/`asChild` triggers (e.g., Radix Tooltip) are high-risk. Always wrap triggers in a `<span>` if they are raw strings, fragments, or potentially nullish.
*   **Module Guards:** Add defensive string conversion `String(content)` to dynamic markdown/HTML outputs to prevent "Functions as React child" crashes.
*   **Registry Gating:** Always use `Array.isArray()` or null-coalescing when mapping over external registry data to prevent boot-time whitescreens.

## 10. API Data Resilience (Staging Hardening)
*   **Total Resilience Pattern:** Always assume the API may return `null` or omit keys for fields that should be strings, booleans, arrays, or numbers.
*   **Resilient Primitives:** Use hardened schema primitives from the shared API-schema module (built on the project's schema library, e.g., Zod):
    *   String schema: defaults to `""` on null/undefined.
    *   Boolean schema: defaults to `false` on null/undefined.
    *   Number schema: defaults to `0` on null/undefined.
    *   Resilient date schema: defaults to epoch (0) instead of throwing on invalid/null dates.
    *   Collection fields: always provide a default empty array (e.g., `z.array(...).default([])`).
*   **ViewModel Filtering:** Never filter solely on the existence of optional nested objects. Always check the reliable top-level fields first (e.g., a top-level `status`).

## Verification

### Invariants (Automated)
- [ ] **Error Boundaries:** `grep "ErrorBoundary"` under the project's source roots (see `project-invariants.md`) — should exist in feature roots.
- [ ] **Loading States:** `grep "Skeleton\|isLoading"` under the source roots — content areas should have loading states.
- [ ] **No Ad-Hoc Errors:** `grep "text-red\|color:.*red\|#[fF][0-9]"` under the source roots — must use the ErrorState component.

### Logic (Manual/Reasoning)
- [ ] **Empty States:** Do all list/grid components use `EmptyState` for empty data?
- [ ] **Form Validation:** Do forms show inline errors with accessible markup?
- [ ] **Skeleton Fidelity:** Does each page skeleton match its page's layout structure?

---

## See Also
- `domain-content.md` — For error message tone and structure.
- `foundation-accessibility.md` — For ARIA live region standards.
- `foundation-performance.md` — For route prefetching (minimizes skeleton visibility).
