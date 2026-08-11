---
trigger: glob
tier: tech:typescript
globs: "**/*.ts"
domain: code-quality
---

# TypeScript & Invariants

Rules for Type Safety, Constants, and Code Quality.

## 1. Type Safety
*   **No `any`:** Avoid `as any` casts. Use specific unions or discriminated narrowing.
*   **Narrowing:** Prefer `if (comp.type === 'layout')` over `as LayoutComponent`.
*   **Type Guards:** Use centralized guards (e.g., `isLayoutComponent`) from a shared type-guards module.
*   **Centralized Types:** Share types in a centralized types module to avoid circular dependencies.
*   **Exhaustive Switch:** All reducer switch statements must have a `default` case that asserts `never`.

## 2. Constants & Imports
*   **Centralization:** Define Magic Strings/Numbers in a centralized constants module (e.g., `TOAST_DURATION_MS`).
*   **New Constants:** Use `as const` objects with derived union types. Do not add new TS enums. See `pattern-code-standards.md` Section 6.
*   **Barrel Files:** If an index file exists, use it. If not, import explicitly.
    *   *Good:* `import { Logo } from './logo/logo'` (if no index).
    *   See `pattern-code-standards.md` Section 4 for barrel file requirements and import ordering.
*   **Precision:** Package names must be exact (no typos in imports).

## 3. Testing & QA
*   **Zero-Tolerance Linting:** `npm run lint` must return 0 errors.
*   **Test IDs:** Use `data-testid="component-{id}"` for all interactive elements (buttons, inputs, draggables).
*   **DevTools:** Add `displayName` to all `forwardRef` components.

## 4. Git & Recovery
*   **Ghost Errors:** If TS errors persist after file deletion, **Restart VS Code TS Server**.
*   **Regression Recovery:** Use `git checkbout <commit> -- <file>` to revert specific files during refactors.

## 5. Verification

### Invariants (Automated)
- [ ] **No `as any`**: `grep "as any" src/` (Use specific types or narrowing).
- [ ] **No Implicit `any`**: TypeScript strict mode should catch these in `npm run build`.
- [ ] **Test IDs**: `grep "data-testid" src/` (Interactive elements should have test IDs).

### Logic (Manual/Reasoning)
- [ ] **Exhaustive Switch**: Do all switch statements have a `default: never` case?
- [ ] **Type Guards**: Are complex type discriminations using centralized guards?
- [ ] **Barrel Exports**: Are shared utilities exported from index files?

---

## See Also
- `pattern-code-standards.md` — For file structure, module organization, and constant naming patterns.
- `foundation-design-tokens.md` — For centralized token constants.
- `tech-react.md` — For React-specific TypeScript patterns.
