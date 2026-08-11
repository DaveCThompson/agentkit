---
trigger: glob
tier: tech:react
globs: "**/*.tsx"
domain: code-quality
---

# React & State Foundations

Rules for Hooks, Component Architecture, and State Management.

## 1. The Rules of Hooks
*   **Top-Level Absolute:** All hooks (`useRef`, `useState`, `useAtom`) **must** be called unconditionally at the top level.
*   **No Event Handlers:** Never call hooks inside `onClick` or formatting functions.
*   **Preview Guards:** If a component has an early return (e.g., `if (preview) return`), all hooks must be called **BEFORE** that return.

## 2. Component Architecture
*   **Declaration Standard:** See `pattern-code-standards.md` for the canonical component declaration pattern (`export function` vs `forwardRef`), file internal structure, and export conventions.
*   **Composition (Radix-Style):** Break UI into distinct, composable parts.
    *   *Pattern:* `<Feature.Root> <Feature.Title /> <Feature.Actions /> </Feature.Root>`
*   **Decouple State:** Use Context Providers to expose atoms/state to sub-components.
*   **No Monoliths:** Do not build single components that handle Create/Update/Thread via generic booleans.
*   **Performance Isolation:** Isolate heavy hooks (`useFloating`) into sub-components (e.g., `ActionToolbar.Floating`).
*   **Registry:** All component definitions must be wired through `componentRegistry.ts`.
    *   **Group Mapping:** UI components MUST NOT hardcode component lists. Use `getGroupsForLab(labId)` or `getGenericComponents()` to dynamically fetch items for the Component Browser.
*   **Lab Promotion:** Components in a Lab-style incubation directory under the components tree are for rapid prototyping. Once a component is used in ≥2 features or reaches a stable architectural state, it MUST be promoted to its own directory in the shared components tree (kebab-case) with local kebab-case CSS module and index file.

## 3. Jotai State Management
*   **Write-Only Atoms:** Use "Cascade Atoms" to orchestrate multi-atom updates (Domain + Persona + Framework) in one transaction.
*   **Context-Aware Patterns:** Use routing atoms (`currentPersistentPromptAtom`) to switch storage backends based on context.
*   **Unused Getters:** Prefix unused Jotai getters with underscore: `(_get, set) => ...`.
*   **Persistence:** All `atomWithStorage` usage MUST use `createSafeStorage` with Zod schema validation.
*   **History Cap:** Limit Undo/Redo history to 50 states.

## 4. Render & Event Logic
*   **Radix Events (Bubble-Wrap):** Wrap Radix triggers in a `div` with `stopPropagation` if inside a draggable area.
*   **TipTap Isolation:** Stop propagation of `onPointerDown` AND `onKeyDown` to prevent backspace deleting the component.
*   **Fast Refresh:** Files exporting React Components **MUST NOT** export atoms or constants. Move them to `atoms.ts` or `constants.ts`.

## 5. Build & Deployment Architecture
*   **Unified Vendor Bundle:** For React 19 projects, **NEVER** use Vite's `manualChunks` to split `node_modules`. This prevents race conditions during initialization that lead to the "setting 'Children' of undefined" whitescreen bug in production.
*   **Asset Loading:** Prefer `?raw` imports for static content (Markdown/CSV) to ensure synchronous availability during render cycles.

## 6. Color Coordination
*   **Explicit Tagging**: All canvas renderers and draggable items **MUST** set a `data-component-type` attribute. 
    *   *Utility*: Use `getComponentTypeFromCategory()` for dynamic mapping.
*   **Variable Inheritance**: When building components that need to match the type color (e.g., custom sliders), consume `var(--type-icon-color)`.

## 6. Verification

### Invariants (Automated)
- [ ] **No Missing Deps**: `useEffect` / `useCallback` / `useMemo` must have correct dependency arrays.
- [ ] **No Console Logs**: `grep "console.log"` (Must be removed before merge).
- [ ] **No Nested Components**: `grep -P "const .* = \(\) => .* const .* = \(\) =>"` (Define outside or in separate file).
- [ ] **Strict Kebab-Case**: Files must follow kebab-case (verified by `npm run lint`).

### Logic (Manual/Reasoning)
- [ ] **Composition**: Is the component doing too much? Should it be split into `Root`, `Trigger`, `Content`?
- [ ] **State Decoupling**: Is localized state trapped in a giant component? Should it be in an Atom or Context?
- [ ] **Performance**: Are heavy hooks isolated in their own components to prevent parent re-renders?

---

## See Also
- `pattern-code-standards.md` — For component declarations, file structure, and commenting standards.
- `pattern-state.md` — For Jotai and global state patterns.
- `foundation-design-system.md` — For React-specific layout principles.
