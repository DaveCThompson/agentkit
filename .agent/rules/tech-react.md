---
trigger: glob
tier: tech:react
globs: "**/*.tsx"
domain: code-quality
---

# React & State Foundations

Preserve React's render, identity and lifecycle contracts while using the project's actual
component, state and build architecture. Discover installed React/framework/compiler versions;
being a React project does not imply a particular registry, store or styling system.

## 1. The Rules of Hooks

Call ordinary Hooks unconditionally at the top level of function components or custom Hooks,
before conditional early returns. Do not call them in handlers, loops or ordinary utility functions.
Keep reactive dependencies complete and obey the installed Hooks lint/compiler checks.

React's `use` API has a documented exception: it can read resources in conditions/loops, but still
belongs inside a component/Hook and cannot be wrapped in try/catch. Apply the installed version's
contract rather than extending this exception to `useState`, `useRef` or library Hooks.
See [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks) and [use](https://react.dev/reference/react/use).

Keep rendering pure. Avoid mutations of external objects and effectful work during render;
synchronize external systems in an owned effect/handler with appropriate cleanup.

## 2. Component Architecture

- Follow applicable `pattern-code-standards.md` conventions and the nearest maintained components.
  Named functions, compound components and focused subcomponents are useful choices, not mandatory
  spellings. Use the installed ref/composition contract when wrapping a primitive.
- Keep local state close to its consumers. Introduce context/store access when it clarifies shared
  ownership, not to replace every prop. Provider/subscription behavior and identity determine
  update propagation; a compound `Root.Title.Actions` API alone does not isolate rendering.
- Split components at meaningful responsibility, lifecycle or measured cost boundaries. Keep
  expensive hooks in the relevant mounted surface when that avoids real work; verify propagation
  in the Profiler rather than promising that extraction prevents all parent/child renders.
- Prefer existing shared APIs before cloning. Promote a prototype when its stable contract and
  consumer needs justify shared ownership, using `pattern-feature-scaffolding.md`; no two-use
  quota, lab directory or required CSS/barrel shape applies universally.
- Use a component registry or dynamic group mapping only when the project actually has that
  discovery model. Preserve its registration contract; do not invent `componentRegistry.ts`
  or a component-browser API in an unrelated application.

## 3. Jotai State Management

Apply this section only when the project uses Jotai. Otherwise use its actual state mechanism.

- Write-only/action atoms can coordinate related updates. Check the installed store's batching
  and async semantics; multiple setters do not make network/persistence side effects an atomic
  transaction. Model partial failure and rollback where required.
- Keep atom/store identities stable where subscribers rely on them. Trace subscriptions before
  moving state into context or adding selectors. Context-dependent storage routing is a project
  concern; preserve the real tenant/user/backend boundaries instead of importing named atoms.
- Validate untrusted persisted data at its boundary with the project's existing schema/adapter.
  Handle missing, stale, malformed, versioned and unavailable storage values. Use a safe-storage
  helper when one exists; no universal `createSafeStorage` or Zod dependency is required.
- Bound undo/redo history by user requirements, memory/payload size and privacy. Preserve history
  semantics and identity when changing representation; 50 states is not a universal limit.

## 4. Render & Event Logic

- In draggable/keyboard-driven containers, inspect event ownership before suppressing propagation.
  Prefer explicit drag handles or the library's exclusion mechanism. A blanket wrapper can break
  focus, selection, keyboard access or expected parent behavior.
- Editors and embedded controls must retain typing, shortcuts and selection while preventing
  unintended outer deletion/drag commands. Test actual pointer/keyboard paths; stop only the
  events that conflict rather than every pointerdown/keydown.
- Keep component type identity stable across renders; a component defined inside another may
  remount and reset state. Same-file module-scope components are valid. Preserve intended keyed
  resets instead of treating every remount as a defect.
- Follow the actual Fast Refresh tooling/export rule. Some mixed exports invalidate refresh
  boundaries; this is not a universal React ban on colocated constants. Separate exports when
  project tooling or ownership requires it.
- Clean effects/subscriptions on replacement and teardown. Handle request rejection, disabled
  states and stale results; changing render priority does not provide cancellation.

## 5. Build & Deployment Architecture

Use the framework's supported server/client boundaries, router splitting and package exports.
Do not prohibit manual chunks based on React's major version alone. For initialization errors,
inspect the actual bundler version, cycles, chunk graph, module side effects and duplicate React
resolution, then test the production artifact and affected navigation path.

Load static content through the platform's existing asset mechanism. `?raw` is a bundler feature,
not universal React syntax; inlining data can increase initial payload. Compare inline, server
and asynchronous loading while preserving readiness/error states.
Use `foundation-performance.md` **Bundle Size** and the `react-performance` references for measured
bundle, async and render decisions. Transitions prioritize React updates; synchronous computation
in their callback still runs immediately.

## 6. Color Coordination

Use the actual design system and type-color contract when one exists. Data attributes and local
custom properties can coordinate icons, sliders and renderers, but their names/values belong to
the project. Inspect DOM/portal inheritance and themes under `foundation-design-tokens.md`.
Do not require category helpers or `data-component-type` tagging in every React component.

## 6. Verification

### Invariants (Automated)

- Run the applicable TypeScript, Hooks/refs lint, test and build checks from project configuration.
  Do not invent a lint command or universal file-casing rule.
- AST/lint checks can locate illegal Hook calls, dependency gaps and unstable nested definitions.
  Text searches for `.current` or `console.log` are triage, not proof of a violation.
- Validate production imports, styles, registration and route loading where build boundaries change.

### Logic (Manual/Reasoning)

- Check the affected contract: state identity, evaluation, controlled inputs, error handling,
  effects, subscriptions, cancellation and accessible interaction.
- Exercise Strict Mode setup/cleanup, remount and hydration where relevant. Required terminal
  states must survive delayed/failed loading and preference changes.
- Use the Profiler/network trace for performance claims. State/context/prop identity and the
  compiler can change costs; count reductions alone do not establish user-visible improvement.
- Record exact relevant state, method, outcomes and gaps using `foundation-testing.md`.

## See Also

- `pattern-code-standards.md` — project conventions for declarations and module organization.
- `pattern-state.md` — applicable state patterns; verify actual store/project contracts.
- `foundation-accessibility.md` — accessible composition, events and ref behavior.
- `foundation-performance.md` — measured loading and rendering decisions.
