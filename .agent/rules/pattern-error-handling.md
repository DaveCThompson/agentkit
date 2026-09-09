---
trigger: model-decision
description: Consult when building error, loading, or empty states, toasts, form validation, or network-error handling — ErrorState/EmptyState/Skeleton primitives, three-tier skeleton architecture, API data resilience.
tier: kind:app
domain: error-handling
---

# Error Handling Patterns

Make failures and pending states understandable without losing data or concealing invalid results.
Use actual framework/data-layer boundaries and shared components; the names below describe useful
roles, not required APIs. Follow `foundation-security.md` for sensitive diagnostics.

## 1. Error Boundaries

- In React, place error boundaries at recoverable UI fault domains. They catch descendant render
  failures, not arbitrary event-handler, asynchronous callback or server errors. Handle those at
  their actual boundary. A framework integration can surface an async failure to a boundary,
  such as supported React transition actions; inspect that version's contract. Other frameworks
  have different mechanisms.
- Provide a usable fallback and preserve unaffected work. Reuse an existing `ErrorState` when it
  fits; a component name alone does not establish recovery.
- Use the project's reporting/logging policy with redaction and deduplication. Development and
  production environments may differ; neither telemetry installation nor universal logging is required.
  See [React error boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary).

## 2. Shared UI Components

Discover the existing shared-UI layer and its supported variants before introducing another
implementation. Extend or compose it when suitable; do not require primitives the project lacks.

### `ErrorState` (shared error-display component)

A useful error display can expose a title, explanation, optional retry/support action and contextual
page/section layout. Use the real prop contract. Retry only an operation that is safe to retry;
a button must trigger a real recovery path, not just clear the displayed error. Style through the
project's token system and justified exceptions.

### `EmptyState` (shared empty-state component)

Distinguish genuine empty data from loading, filtered-out data, forbidden access and failure.
Include a relevant action only when one exists. Use semantic text/icon roles without prescribing
specific token names; do not erase context to force every empty state into one component.

### `Skeleton` (shared loading-placeholder primitive)

Match meaningful reserved geometry to reduce distracting changes. Text/circle/rectangle variants
and shimmer are options, not required APIs. Respect reduced motion and avoid announcing decorative
placeholders repeatedly. Co-locate keyframes or use the project's explicit global/export mechanism:
CSS Modules can scope names, so verify the emitted animation reference rather than assuming a
cross-file name resolves or that every stylesheet system behaves the same.

## 3. Loading Architecture (Three-Tier Skeleton)

These tiers are a diagnostic model for client apps, not a requirement to hide useful server content.

### Tier 1: HTML Shell (Pre-JavaScript)

Keep meaningful initial content or a usable bootstrap/failure fallback when startup is delayed.
Use the actual server/theme initialization contract; an early theme script may need CSP and storage
error handling. Do not add a blocking script by default. Place persistent styles where the framework
owns them: replacing a client mount differs from hydrating server markup. Inline styles can be
intentional, including token bridges; inspect cascade and theme behavior.

### Tier 2: App-Shell Skeleton (Auth Loading)

Retain the app shell where it is safe and useful during auth/chunk loading. Do not expose protected
content while authorization is unresolved. Handle rejected, signed-out and expired states explicitly;
an auth error must not leave a permanent skeleton.

### Tier 3: Per-Page Skeletons (Within the App Shell)

Choose skeletons, progress, spinners or retained stale content by expected wait and task.
For layout-matching skeletons, verify gaps, widths and dynamic content rather than cloning every page.
Wire the real router/data-layer loading and error mechanisms; settle success, empty and failure.

## 4. Toast Notifications

Use local timing, placement and queue policy based on urgency, reading time and actionability.
Do not impose fixed durations/counts or make every error persistent. Important instructions and
recoverable work must remain available after a toast disappears. Avoid duplicate global/feature
notifications; prefer concise result and next-action copy.

## 5. Form Validation

- Associate inline errors/instructions with fields and expose invalid state. Use more than color.
- Validate at appropriate interaction boundaries, including submission. Avoid premature noisy errors,
  but do not clear a still-relevant error merely because editing began.
- Use an error summary with field links when it helps navigate multiple failures. Focus the summary
  or first invalid field according to the form's accessible flow.
- Preserve entered data and distinguish validation, transport, permission and business-rule failures.

## 6. Network Errors

- Keep initial loading, stale refresh, empty, offline and failed outcomes distinct. Connectivity
  signals are hints; a successful network interface does not prove the API is reachable.
- Choose timeout/cancellation behavior for the operation, including streaming and long jobs.
  A client timeout does not prove a server write was cancelled. Reconcile ambiguous mutations and
  use their idempotency contract before retrying under `pattern-external-mutation.md`.
- Normalize transport errors without discarding status, safe context or caller-specific recovery.
  Shared interceptors should not emit duplicate generic toasts by default.
- Feature handlers usually own contextual user messaging. Centralized auth handling is valid where
  it preserves the actual session/redirect contract and does not treat every denial as signed-out.

## 7. Accessibility

Choose status/live-region urgency by the message; `role="status"` is polite, an urgent alert may
need assertive announcement. Avoid duplicate announcements and unsolicited focus changes.
Test field associations, summary navigation, focus after recovery and non-color cues under
`foundation-accessibility.md`; do not require both icons and text for every message.

## 8. Hyper-Defensive Component Wrappers

Validate composition instead of masking faults. Slot/`asChild` triggers need the actual library's
supported child, props, events and ref contract. Replacing a null/fragment/string with an arbitrary
span does not give it button semantics or keyboard behavior. See
[Radix composition](https://www.radix-ui.com/primitives/docs/guides/composition).

Validate dynamic renderer input at its boundary. `String(content)` is not a sanitizer and can hide
invalid function/object values. An `Array.isArray` check is useful when an array is required, but
decide whether invalid data must be rejected, shown as unavailable or safely defaulted.

## 10. API Data Resilience (Staging Hardening)

Treat external payloads as untrusted and validate the actual schema. Distinguish absent, null,
invalid and legitimate falsy values. Use defaults only where the domain defines their meaning;
do not turn malformed dates into epoch, missing entitlement into apparent success, or invalid
numbers into zero. Preserve diagnostics without exposing sensitive payloads.

Use the existing schema library and test its exact default/coercion/null behavior; an undefined
default need not handle null. For collections, a legitimate empty fallback is different from a
failed response. Filter view models by the authoritative domain contract, not always by a top-level
status or always by optional nested-object presence.

## Verification

### Invariants (Automated)

- Use the project's collected tests for boundary fallback, typed errors, retry wiring and schema
  validation. Include invalid/null/absent input and legitimate falsy values where meaningful.
- Source searches can locate boundaries and state branches. No count of `ErrorBoundary` or
  `Skeleton`, and no color grep, proves recovery or component compliance.

### Logic (Manual/Reasoning)

- Exercise initial loading, refresh, empty, rejection, offline/recovery and ambiguous submission.
- Check accessible feedback, retained input, focus and readable layout through those transitions.
- Report untested framework/browser/API boundaries under `foundation-testing.md`.

## See Also

- `pattern-ui-copy.md` — contextual error text; a project's `domain-content.md` may add tone policy.
- `foundation-accessibility.md` — naming, focus and status announcements.
- `foundation-performance.md` — measured loading and delivery choices.
