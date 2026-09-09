---
trigger: glob
globs: "**/*.{ts,tsx}"
domain: code-quality
---

# DX Code Standards

Make component APIs, module ownership and consequential constraints easy to find.
Use these as defaults where the project has not settled a convention; preserve framework exports,
existing public contracts and legitimate project overrides.

## 1. Component Declarations

### Standard: Named Function Export

Prefer named functions/exports for a discoverable public component API when compatible with
the project. Named arrows are also valid. Choose types from the actual model and supported
React/TypeScript versions; do not invent imports or props to fill a template.

### forwardRef Exception

A wrapper must preserve the underlying primitive's props, handlers and required ref access.
For React 18 function wrappers, `forwardRef` is a common solution; React 19 supports ref as a prop.
Follow library compatibility and the installed typing contract. A useful display name improves
debugging for wrappers that would otherwise appear anonymous.
See [React forwardRef guidance](https://react.dev/reference/react/forwardRef).

### Banned Patterns

Apply explicit project bans through their configured scope. This kit does not treat `React.FC`,
default exports, named arrows or dual exports as inherently invalid TypeScript/React.
Prefer a clear stable API; avoid redundant exports when they add ambiguity, but preserve public
compatibility when consumers depend on them. Do not attribute a blanket `React.FC` prohibition
to the React team.

### Framework Exception: Next.js App Router special files

Follow each file convention, not a blanket rule for all framework files. Next.js page/layout and
several UI boundary files require default component exports. App Router `route.ts` handlers
instead export named HTTP methods such as `GET` and `POST`; see
[Next.js route handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route).

Other frameworks, test tools, configuration files and `React.lazy` adapters may also expect default
exports. Inspect the actual consumer before converting exports. Keep boundary files thin when
delegation clarifies a real responsibility; do not require a comment explaining every ordinary
framework convention.

## 2. Comment Philosophy — "Why Not What"

### When to Comment

Explain non-obvious intent, constraints, compatibility workarounds and failure boundaries.
Use established `// WHY:`, `// CONSTRAINT:` or `// CRITICAL:` markers when they aid discovery.
Document exported hooks/utilities where preconditions, side effects or result semantics are
not clear from names and types.

### When NOT to Comment

Omit restatements of simple props, imports and ordinary syntax. Do not add JSDoc merely because
a function is exported, or delete an important explanation because the code uses a familiar Hook.

### Module Header Format

A short header can name a module's transformation, ownership or time/identity assumptions.
Keep it specific to the implementation. Self-explanatory modules do not need ceremonial headers.

## 3. File Internal Structure

### Component Files

A useful default is imports → local types/constants → pure helpers → primary component →
module-scope subcomponents/exports. Follow project formatter/lint rules and readability.
Preserve evaluation order and directive prologues such as `'use client'`; CSS and other side-effect
import ordering can affect behavior. Do not duplicate exports merely to satisfy a bottom section.

### Hook Files

Keep options/result types, pure helpers and the hook easy to navigate. An explicit public return
type helps when it stabilizes a boundary; inferred types are valid when they remain clear.

### Utility Files

Group related constants, types and functions by responsibility and dependency. Avoid moving every
helper into a separate file or hiding related code across artificial layers.

### Section Markers

Use section comments in a dense file when they improve navigation. Line count alone does not
require markers or extraction. Preserve existing meaningful markers consumed by tooling.

## 4. Module Organization

### Export Convention

Prefer named exports for discoverable APIs; preserve defaults where framework, tooling, package
compatibility or project convention needs them. Choose a public module boundary deliberately.

### Barrel Files

Use an index/barrel when it defines an intentional public API or existing consumer contract.
It is not required in every feature or primitive directory. Inspect cycles, server/client
boundaries, side-effect imports and actual bundle cost before adding or removing one.
Do not turn a hook/type count into a directory or barrel requirement.

### React Import

Use the configured JSX transform. The automatic transform does not need a React value import for
JSX alone; the classic transform may. Import runtime APIs as named bindings or through a namespace,
and use type imports where appropriate. Do not remove an import needed by the actual compiler or
an explicit `React.*` expression.

### Import Ordering

Follow the project's configured groups and aliases. Deterministic grouping aids scanning, but
reordering side-effect imports or evaluation-sensitive cycles can change behavior. Preserve CSS
cascade/initialization ordering and validate affected consumers after mechanical rewrites.

### Feature Module Template

Start with a small existing module that fits the responsibility. A feature might contain an entry
component, a co-located test and its stylesheet under the established naming scheme. Add a helper,
hook, schema or public index only when there is actual code and an ownership reason for it.

Flat files are the default. Add a nested directory only when a prefixed flat file cannot serve
the project's organization or required framework layout. This applies consistently to components,
view models, tests and schemas; do not scaffold empty folders by a fixed template.

## 5. Architectural Patterns

### Standard: Page Conductor Pattern

A page can coordinate data and focused views when that makes its responsibilities easier to
understand. A view-model hook is useful for a real state/data orchestration boundary; it is not
required for every page. Keep pure transformations close or shared according to actual consumers.

### Standard: Internal Sub-component Extraction

Extract dense JSX at a meaningful behavior/layout boundary. Same-file module-scope subcomponents
are often sufficient; separate files suit independent ownership or reuse. Do not define a new
component type inside a render merely to shorten it: identity changes can reset state.
No 300/500-line threshold proves the correct boundary.

### Standard: Service Layer for AI/API Logic

Separate complex request construction, validation and response parsing when it clarifies trust
or transport boundaries. Reuse the existing service seam; preserve authentication, cancellation,
errors and observability. Simple request logic need not acquire another layer.

### Standard: Transport Layer for Live/Dev Branching

Repeated source-selection branches can share an existing transport adapter. Preserve cache keys,
response contracts and failure behavior across live/mock paths. A new directory is not required.

### Standard: Overlay Renderer Pattern

Keep page layout readable. Extract overlay state/rendering when dense branches obscure it, while
retaining focus, dismissal, modal containment and state ownership.

### Standard: Fail Config Invariants at Registration, Not Render

Validate stable configuration early enough to prevent invalid work, preferably at its registration
or input boundary. Choose failure behavior by consequence: development assertions aid diagnosis,
but production authorization/data-integrity invariants must remain enforced. Optional presentation
can use an explicit safe fallback with diagnostics; never turn an invalid privileged operation into
success. Validate dynamic/untrusted inputs at runtime as well as static configuration at build time.
Do not universally guard invariant enforcement behind a dev flag.

## 5. Type Patterns

### Props Interface

Keep props near the component or at the actual shared API owner. Names such as
`ComponentNameProps` are useful conventions. Interfaces and type aliases both describe object
shapes; choose interfaces for intended extension/declaration merging and aliases for unions or
other compositions. Neither is universally clearer. Export types consumers need.
See [TypeScript types and interfaces](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html).

### When to Extract to types.ts

Extract when types define shared domain ownership or a stable external contract. A discriminated
union can clarify valid states while staying local. Three interfaces or consumers are not a
mandatory extraction threshold.

### Zod Schema Placement

Use the project's existing validation library and ownership boundary. Colocate schemas with
the domain/input contract or reuse the established shared module. Do not add Zod or a schemas
directory solely to follow this example.

### Type Imports

Use `import type` for imports needed only in type positions where supported by the compiler and
project conventions. Preserve value imports needed at runtime and check module emission settings.

## 6. Constants & Configuration

### Naming

Follow project casing. `UPPER_SNAKE_CASE` suits many fixed primitive settings; `camelCase` suits
many configuration objects. Names should convey units, ownership and meaning.

### New Code: `as const` Objects

An `as const` object with a derived union is a useful alternative to an enum when literal values
fit the API. It does not impose an automatic migration of existing enums. Preserve runtime value,
serialization and public typing contracts; follow explicit project policy for new declarations.

### Scope

Keep constants local unless consumers share the same meaning and change ownership. Two uses do
not automatically justify a global constants module; similar values may represent different roles.

## 7. Test Documentation

### File Naming

Follow actual test discovery and project naming. Co-located `.test.tsx` files are a useful option;
a separate adversarial suffix is optional and must be collected by the runner.

### describe/it Naming

Name the subject and observable behavior, such as “groups sessions by the caller's local date.”
Avoid “renders correctly” when it hides the assertion. Keep names truthful when scope changes.

### Test Comments

Explain non-obvious fixture assumptions and what mocks omit. A comment is valuable when it prevents
a false inference about production coverage, not because every mock needs a prescribed format.

### Refactor Test Expectations

Prefer behavior, role, name and state assertions when those express the contract. Preserve
deliberate inert/modal behavior. Change an implementation-coupled assertion only after checking
the intended invariant; explain material oracle/fixture changes. Do not erase behavioral failures
by relabeling old expectations obsolete. Follow `foundation-testing.md`.

## 8. AI-Agent Readability

Stable names, nearby types/tests, clear public exports and explicit constraints help readers
locate behavior. One component per file is a possible project convention, not a React rule.
Same-file related helpers/components can be clearer. Optimize for understandable ownership and
correct navigation rather than file/type counts or assumed agent preferences.

## 9. Animation State Gates

Use state for a value that must affect rendered output. Use refs for imperative controller state
that is not read to determine JSX. React discourages reading/writing refs during render except
documented predictable initialization; see [useRef](https://react.dev/reference/react/useRef).

When an entry-played flag changes animation props, inspect the installed animation library's
mount, key, variant and effect behavior. Setting state may rerender consumers or reinitialize an
animation; it is not universally harmless. Define whether “played” survives a remount, navigation
or preference change, then verify completion, skip, interruption and teardown. Preserve required
readiness without reviving unmounted controllers; use `pattern-motion.md` where GSAP applies.

## Verification

### Invariants (Automated)

Use the actual compiler, configured AST/lint rules and test discovery for declaration, import,
Hook/ref and API constraints. Search can locate candidates; `.current`, `export default` or
`React.FC` occurrence alone is not a violation. Scope any project-specific ban to applicable
files and documented exceptions rather than a global grep.

### Logic (Manual/Reasoning)

- Check non-obvious constraints and the public API against actual consumers.
- Check dependency direction, import effects, module identity and required framework exports.
- Verify that extraction improves responsibility boundaries while preserving semantics.
- Check production failure behavior, animation terminal states and relevant evidence gaps.

## Automated Checks

Harvested by `agentkit verify` against configured `sourceRoots`. This low-severity candidate
highlights a styling decision; it does not ban inline styles or mandate CSS Modules. Confirm the
project's policy and retain valid runtime geometry, animation and CSS-variable bridge cases.
Project exceptions belong in the owning check, not a global source exclusion.

```agentkit-checks
[
  {
    "id": "inline-style-object",
    "pattern": "style\\s*=\\s*\\{\\s*\\{",
    "globs": [
      "*.tsx"
    ],
    "severity": "low",
    "message": "Inline style review candidate — follow project styling; retain runtime, measured and CSS-variable bridges"
  }
]
```

## See Also

- `tech-react.md` — Hooks, composition, state and build contracts.
- `tech-typescript.md` — applicable TypeScript policy; framework/public contracts still govern.
- `pattern-refactoring.md` — semantic preservation and ownership.
- `foundation-testing.md` — actual evidence, test discovery and gate scope.
