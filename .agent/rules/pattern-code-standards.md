---
trigger: glob
globs: "**/*.{ts,tsx}"
domain: code-quality
---

# DX Code Standards

Standards for component declarations, file structure, comments, module organization, and AI-agent readability. These apply to all TypeScript and TSX files in the project.

## 1. Component Declarations

### Standard: Named Function Export

All non-`forwardRef` components use `export function`:

```tsx
interface TaskCardProps {
  task: TaskCardModel;
  onLaunch: (task: TaskCardModel) => void;
}

export function TaskCard({ task, onLaunch }: TaskCardProps) {
  return (/* ... */);
}
```

### forwardRef Exception

Shared UI primitives (the project's shared-UI layer — see `project-invariants.md`) wrapping Radix use `const` + `forwardRef` + `displayName`:

```tsx
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    return <button ref={ref} className={cn(styles.button, className)} data-variant={variant} {...props} />;
  }
);
Button.displayName = 'Button';
export { Button };
```

### Banned Patterns

- `React.FC` — no longer recommended by React team, adds no value in modern TS
- `export default` — causes rename-on-import inconsistency, breaks find-and-replace
- Dual export (`export const X` + `export default X`)
- Anonymous arrow exports

### Framework Exception: Next.js App Router special files

Next.js **requires** a default export from its App Router special files. These are the *only* sanctioned `export default` sites; do not "fix" them to named exports and do not let a `grep "export default"` invariant flag them.

- `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `global-error.tsx`, `not-found.tsx`, `template.tsx`, `default.tsx`, and route handlers' conventions.
- Keep the body thin: when there is real logic, delegate to a named-export component (e.g. `loading.tsx` → `export default function WorkLoading() { return <RouteLoading .../>; }`). Mark the file with `// WHY: Next.js requires a default export for <file>.tsx.`

## 2. Comment Philosophy — "Why Not What"

### When to Comment

| Marker | Use For |
|--------|---------|
| Module header | Complex files where purpose is non-obvious from filename |
| `// WHY:` | Non-obvious business logic, workarounds, intentional tradeoffs |
| `// CONSTRAINT:` | Architectural invariants embedded in code |
| `// CRITICAL:` | Data integrity or crash-risk paths |
| JSDoc on hooks | All exported custom hooks — preconditions + return shape |
| Inline comments | When surrounding code would otherwise be misread |

### When NOT to Comment

- Self-documenting prop interfaces (`label: string` does not need `/** The label */`)
- Standard React patterns (`useEffect`, `useState`, `useMemo`)
- Import sections
- Anything TypeScript types already explain

### Module Header Format

For files where purpose is non-obvious from filename:

```tsx
/**
 * Sessions View Model
 *
 * Transforms raw coaching session DTOs into the section-based display model.
 * Handles time-based bucketing (next-up, today, upcoming) and status filtering.
 * All date comparisons use the caller's local timezone.
 */
```

Skip for self-documenting filenames like `Button.tsx` or `TaskCard.tsx`.

## 3. File Internal Structure

### Component Files

```
1. File header (optional — only if purpose non-obvious)
2. Imports
   a. React / framework
   b. Third-party packages
   c. @/ aliased imports (app → shared → features → services → utils)
   d. Relative imports (parent → sibling)
   e. CSS modules (always last)
3. Types / Interfaces (props, local types)
4. Constants (file-scoped)
5. Helper functions (pure, non-React)
6. Component declaration
7. Sub-components (compound pattern, as const)
8. Named exports (at bottom, grouped)
```

### Hook Files

Imports → types (options + return) → helper functions → hook → export

Exported hooks should declare an explicit return interface when the returned object has multiple fields or is consumed across feature boundaries.

### Utility Files

Imports → types → constants → functions (low-level to high-level) → exports

### Section Markers

For files exceeding 150 lines, use region comments:

```tsx
// --- Types ---
// --- Helpers ---
// --- Component ---
// --- Sub-components ---
```

## 4. Module Organization

### Export Convention

Named exports only. No `export default`.

### Barrel Files

- REQUIRED: a barrel `index.ts` in each shared-UI primitive directory
- REQUIRED: a barrel `index.ts` in each feature directory
- OPTIONAL: a hooks-directory barrel when 3+ hooks exist
- NEVER: a nested `components` subdirectory within a feature, `view-model` directories, test directories

The project's exact shared-UI and feature roots live in `project-invariants.md`.

### React Import

Vite's automatic JSX transform does NOT require `import React from 'react'`. Only import React when using React namespace APIs directly:

- `React.forwardRef` — required for shared UI primitives
- `React.lazy` — required for lazy loading
- `React.memo` — required for memoized components
- `React.createElement` — rare, but needed outside JSX

Files that only use JSX (`<div>`, `<Button>`, etc.) must NOT import React.
This applies to test files too.

### Import Ordering

1. React (always first **if present** — see above)
2. Third-party packages (alphabetical)
3. `@/` aliased imports (by layer)
4. Relative imports (parent first, then sibling)
5. CSS modules (always last)

### Feature Module Template

```
src/features/{feature-name}/
  index.ts               # barrel (always)
  {FeatureName}Page.tsx
  {FeatureName}Page.module.css
  {FeatureName}Page.test.tsx
  types.ts               # when 3+ interfaces
  constants.ts           # when 2+ constants
  view-model/            # when non-trivial data transforms
  components/            # when 2+ sub-components
  hooks/                 # when feature-specific hooks
  utils/                 # pure business logic/transforms
  schemas/               # when Zod schemas
```

## 5. Architectural Patterns

### Standard: Page Conductor Pattern

Major feature pages SHOULD follow the **Conductor** pattern to keep the view layer high-level and readable:
- **Page Component**: Primary responsibility is layout and wiring (e.g., `DashboardPage.tsx`). It orchestrates a **ViewModel** and passes data to focused sub-components.
- **ViewModel Hook**: Primary responsibility is state management and data orchestration (e.g., `useDashboardViewModel.ts`). It hides the complexity of TanStack Query, Jotai, and local state from the view.
- **Pure Helpers**: Complex transformations or filtering logic MUST be extracted to a sibling `utils/` or `services/` layer.

### Standard: Internal Sub-component Extraction

When a component exceeds 300 lines due to dense JSX:
1. Identify logical sub-sections (e.g., a complex Form Field).
2. Extract into a named function component within the **same file** under the `// --- Sub-components ---` marker.
3. Only move to a separate file if the sub-component is reused OR the parent file remains over 500 lines after internal extraction.

### Standard: Service Layer for AI/API Logic

Complex request building (e.g., structured prompts) and response parsing (e.g., JSON cleaning) MUST be extracted to a dedicated service layer (a sibling `services/` module) rather than living inside Query hooks or ViewModels.

### Standard: Transport Layer for Live/Dev Branching

When query hooks support both live API and local preview/dev-mode data, the source-selection logic SHOULD live in a sibling transport module rather than inside every hook.

### Standard: Overlay Renderer Pattern

When a page owns multiple dialogs, launchers, or modal branches:
- keep page-level layout/conductor logic in the page
- extract overlay state to a dedicated hook when it improves clarity
- extract overlay rendering to a dedicated renderer component when the conditional JSX becomes dense

### Standard: Fail Config Invariants at Registration, Not Render

A config invariant that would otherwise **degrade silently at render time** must throw at
registration / module-load time in dev. When a registry entry, step config, or option map is
malformed (a missing index, a duplicate key, an out-of-range value), asserting it where it is
*registered* surfaces the bug at boot with a clear stack trace; deferring the same check to render
turns it into a silent visual degradation nobody catches (observed: a `progressSteps` index-switch
that silently dropped a modal step). Guard the throw behind the project's dev-build flag so
production fails soft.

## 5. Type Patterns

### Props Interface

- Declare immediately above the component, in the same file
- Name: `{ComponentName}Props`
- Use `interface` (not `type`) — better error messages, extendable
- Export only when consumers need it

### When to Extract to types.ts

- 3+ components in the same feature share a type
- The type represents a domain model used across the feature boundary
- A discriminated union defines feature states

### Zod Schema Placement

- Feature-level: a `schemas/` directory inside the feature
- API response: a top-level `schemas/` module
- Atom validation: co-located with the atom file

### Type Imports

Use `import type { }` for type-only imports.

## 6. Constants & Configuration

### Naming

- `UPPER_SNAKE_CASE` for primitive constants: `TOAST_DURATION_MS`, `MAX_RETRY_COUNT`
- `camelCase` for object constants: `sessionsTabValues`, `surveyFieldConfig`

### New Code: `as const` Objects

```ts
export const SessionTab = {
  Current: 'current',
  Completed: 'completed',
} as const;

export type SessionTabValue = (typeof SessionTab)[keyof typeof SessionTab];
```

Do not add new TS enums. Any existing enums are legacy — migrate incrementally.

### Scope

- Feature-local (`constants.ts`) when used by a single feature
- Centralized (a top-level `constants/` module) when used by 2+ features

## 7. Test Documentation

### File Naming

- Standard: `{ComponentName}.test.tsx` — co-located with source
- Adversarial: `{ComponentName}.adversarial.test.tsx` — edge cases, malformed data

### describe/it Naming

- `describe`: component or function name (no prefix)
- `it`: verb-first, describes user-visible behavior
  - Good: `it('groups sessions into next, today, and upcoming sections')`
  - Bad: `it('should render correctly')`

### Test Comments

- Mock setup: one-line comment explaining what is replaced and why
- Adversarial fixtures: JSDoc block at top explaining fixture purpose

### Refactor Test Expectations

- Prefer role, label, heading, and behavior assertions over placeholder strings that are likely to drift.
- If a modal or overlay intentionally makes the background inert, tests must reflect that interaction contract.
- When a refactor changes the implementation shape but not the behavior, update stale tests to assert the real user-visible contract instead of preserving obsolete internal text.

## 8. AI-Agent Readability

- One component per file (filename → component 1:1 mapping)
- Named exports (agents can grep for exact symbol names)
- `interface` over `type` for object shapes (agents can follow `extends` chains)
- Co-located tests (agents find `Foo.test.tsx` adjacent to `Foo.tsx`)
- Structured markers (`// WHY:`, `// CONSTRAINT:`, `// CRITICAL:`) are programmatically searchable
- JSDoc on module boundaries (exported hooks, complex utilities)

## 9. Animation State Gates

When a flag controls whether an entry animation has played (to avoid re-triggering on subsequent renders), use `useState`, **not** `useRef`.

**Why:** The `react-hooks/refs` rule bans reading `ref.current` during render. State is safe to read in JSX.

**Pattern:**
```tsx
const [entryPlayed, setEntryPlayed] = useState(false);

// In JSX:
initial={entryPlayed ? undefined : { opacity: 0, scale: 0.6 }}
transition={{ delay: entryPlayed ? 0 : ring.entryDelay }}
onAnimationComplete={() => { if (!entryPlayed) setEntryPlayed(true); }}
```

The `setEntryPlayed(true)` re-render is harmless — Framer Motion only transitions when `animate` values change, so no animation replays.

---

## Verification

### Invariants (Automated)

- [ ] **No React.FC**: `grep -rn "React.FC" <source-roots> --include="*.tsx"` (Use named function exports)
- [ ] **No export default**: `grep -rn "export default" <source-roots> --include="*.tsx"` (Use named exports)
- [ ] **No unnecessary React import**: Files using only JSX must not have `import React from 'react'`
- [ ] **No ref reads in render**: `grep -rn "\.current" <source-roots> --include="*.tsx"` — verify none are read directly in JSX return
- [ ] **UI barrels**: Every shared-UI primitive directory contains an `index.ts`
- [ ] **Feature barrels**: Every feature directory contains an `index.ts`

(`<source-roots>` = the project's `sourceRoots` from `.agentkit.json`; see `project-invariants.md`.)

### Logic (Manual/Reasoning)

- [ ] Are `// WHY:` comments present for non-obvious business logic?
- [ ] Are documented fragile exceptions paired with `// CONSTRAINT:` markers?
- [ ] Do exported hooks have a JSDoc one-liner?
- [ ] Do extracted hooks expose explicit return interfaces when the return object is non-trivial?
- [ ] Does the file follow the canonical internal ordering?
- [ ] Is the exported API understandable without reading the full implementation?

## Automated Checks
Harvested by `agentkit verify` and run against the project's `sourceRoots`.

```agentkit-checks
[
  {"id":"inline-style-object","pattern":"style=\\{\\{","globs":["*.tsx"],"severity":"medium","message":"Inline style object — prefer CSS Modules (exceptions: motion, measured layout, gesture/CSS-var bridges)"}
]
```

---

## See Also

- `tech-react.md` — For hooks, composition, and Jotai patterns.
- `tech-typescript.md` — For type safety, centralized types, and barrel exports.
- `foundation-testing.md` — For verification commands and E2E test quality.
