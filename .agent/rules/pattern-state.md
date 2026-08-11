---
trigger: glob
globs: "**/*Atom*.ts"
tier: kind:app
domain: state
---

# State Management Patterns

Standards for Jotai atoms, derived state, and state organization.

## 1. Atom Naming
*   **Convention:** `[domain][Entity]Atom` (e.g., `promptConfigAtom`, `userPreferencesAtom`)
*   **Derived State:** `[domain][Entity]Selector` or `derived[Entity]Atom`
*   **Async Atoms:** `[domain][Entity]AsyncAtom` for atoms with async read/write

## 2. Atom Organization
*   **Co-location:** Define atoms near the feature that owns them.
*   **Barrel Exports:** Export from the shared state barrel for cross-feature access.
*   **No Orphans:** Every atom should have at least one consumer.

```
src/
├── state/
├── index.ts              # Barrel export
├── promptStateAtoms.ts   # Prompt-related atoms
└── uiStateAtoms.ts       # UI preferences
└── features/
    └── editor/
        └── editorAtoms.ts    # Feature-specific atoms
```

## 3. Derived State
*   **Prefer Selectors:** Use `atom((get) => ...)` for computed values.
*   **Avoid Duplication:** Don't store state that can be derived.
*   **Memoization:** Jotai handles this; don't add manual memoization.

## 4. Async Atoms
*   **Suspense-Ready:** Design atoms to work with React Suspense.
*   **Error Handling:** Wrap async operations in try/catch; expose error state.
*   **Loading State:** Use separate `isLoadingAtom` or atom family patterns.

## 5. Atom Families
*   **When to Use:** For dynamic collections (e.g., `todoAtomFamily(id)`).
*   **Cleanup:** Remove unused family members to prevent memory leaks.
*   **Key Strategy:** Use stable, unique identifiers as keys.

## 6. Persistence
*   **atomWithStorage:** Use for user preferences that should persist.
*   **Key Naming:** `app:[domain]:[key]` format for localStorage keys.
*   **Migration:** Version storage keys if schema changes.

## 7. Anti-Patterns
*   ❌ **Prop Drilling:** If passing state through 3+ components, use an atom.
*   ❌ **God Atoms:** Don't create atoms with too many responsibilities.
*   ❌ **Direct Writes:** Use write atoms or actions for complex updates.
*   ❌ **Computed in Components:** Move derived logic to selector atoms.

## 8. Testing
*   **Provider Wrapper:** Use `<Provider>` in tests to isolate atom state.
*   **Mock Atoms:** Create test-specific atoms for controlled testing.
*   **Snapshot Testing:** Avoid; prefer behavior-based testing.

## Verification

### Invariants (Automated)
- [ ] **Naming:** `grep -r "Atom = atom" src/` (Check naming conventions)
- [ ] **Barrel Export:** All shared atoms exported from the shared state barrel

### Logic (Manual/Reasoning)
- [ ] **No Orphans:** Are all atoms used by at least one component?
- [ ] **Derived First:** Is duplicated state avoided through selectors?

---

## See Also
- `tech-react.md` — For component-level state integration.
- `tech-typescript.md` — For type-safe atom definitions.
