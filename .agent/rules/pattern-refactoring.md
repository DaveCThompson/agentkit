---
trigger: model-decision
description: Consult before refactoring layout pages or any behavior-preserving refinement — CSS Module extraction, hardcoded-color eradication, conductor preservation, dead-code deletion hygiene, dormant-feature exclusions.
domain: code-quality
---

# High-Rigor Refactoring Standards

## Purpose

This document outlines the **High-Rigor Quality Standards** used to refactor and align layout pages within the the application. This approach guards against layout fragility, prevents "Utility Class Pollution", and enforces absolute design system adherence.

These standards also apply more broadly to behavior-preserving code refinement:
- extract pure helpers before abstractions
- prefer same-file subcomponent extraction before creating more files
- preserve documented fragile exceptions
- improve responsibility boundaries, not just line counts

---

## 📐 1. Layout Bounding & Extraction (CSS Modules)

### Policy
**Do not use inline Tailwind classes for viewport anchors, grids, or iterative list gaps.** Layout behavior should reside in a scoped `.module.css` file.

### Standard Bounding Classes
All viewports should define or utilize standard semantic layout hooks:

-   **`.container`**: Manages bounding box layouts (e.g. `max-width: 80rem`, `padding: 1.5rem`).
-   **`.flexRow`**: Flex containers that safely toggle between `flex-direction: column` and `row` using responsive media queries without polluting the HTML element.
-   **`.cardList` / `.tabsContent`**: Scoped container wrappers managing loop iterations (e.g., `<Card>` maps) using accurate `gap` declarations instead of inline top-margin (`space-y-4`) utilities.

### 📝 Example: Layout Extraction

**❌ Avoid (Inline Grids)**
```tsx
<div className="mx-auto max-w-7xl px-6 py-10">
  <section className="space-y-4">
    {items.map(card => <Card className="p-4 flex gap-4">{card}</Card>)}
  </section>
</div>
```

**✅ Prefer (Modular layout)**
```tsx
/* Page.module.css */
.container { max-width: 80rem; margin: 0 auto; padding: 1.5rem; }
.cardList { display: flex; flex-direction: column; gap: 1rem; }

/* Page.tsx */
<div className={styles.container}>
  <section className={styles.cardList}>
    {items.map(card => <Card className={styles.sessionCard}>{card}</Card>)}
  </section>
</div>
```

---

## 🎨 2. Absolute Color String Eradication

### Policy
**Absolute Hex Strings (`#5E984C`) or Hardcoded Background Classes (`bg-red-50`) must not exist in layout nodes.** All colors must follow semantic design mappings.

### Mappings
-   Use semantic tokens: `var(--surface-bg-primary)`, `var(--text-secondary)`, and the project's error tokens (see `project-invariants.md`).
-   **No fallback values** in `var()` calls — if a token is missing, fix the token layer, do not paper over it with hex fallbacks.
-   Direct primitive references (`var(--primitives-green-600)`) are acceptable for one-off alert colors but must not include hardcoded fallbacks.

---

## 🎛️ 3. Tactile Feedback & States

### Button Overlays
All critical action frames utilize scaling layers (e.g., sizing background masks via `::before` overlays) ensuring interactions scale linearly without causing layout buffer wobble weights.

### Segmented Controls (Capsule Pills)
Tabs or list view buttons acting as primary feature switches must adopt **Cylindrical Capsule Models** (`border-radius: 9999px`). 
Standard `<TabsList>` and `<TabsTrigger>` implementations are upgraded globally using absolute capsules instead of discrete standard layout radii to achieve absolute switch slider feedback faithfully.

---

## 🔬 4. Checklist for Future Refactoring

Before committing a UI feature rewrite, ensure:
1.  [ ] **Zero inline display grids/flex models** remain in the render return.
2.  [ ] At least **one scoped `.module.css`** oversees page dimension heights.
3.  [ ] **No direct sizing calculations** are written on text headings.
4.  [ ] Absolute values are fully mapped back onto primitive maps securely.

## 5. Modern Refine Patterns

### Transport Extraction

When live/dev or live/mock branching repeats across query hooks, extract it into a transport module so hooks stay focused on query contracts.

### Overlay Extraction

When page-level modal branches become dense:
- extract overlay state to a hook if it improves clarity
- extract overlay rendering to a renderer component if the conditional JSX obscures the page conductor

### Conductor Preservation

Pages should become clearer conductors after a refactor. If a refactor moves complexity around without making the page easier to read, it is not yet finished.

### Fragile Exceptions

If a narrow exception exists for visual stability or behavioral safety, preserve it and document it with `// WHY:` and `// CONSTRAINT:` markers instead of “normalizing” it away.

## 6. Dead-Code Deletion Hygiene

Deleting a feature means deleting its whole footprint, not just the `.tsx`. The build will not catch the leftovers, so they hide as dead code.

- **CSS Modules do not fail the build on unused classes.** When you remove a component or feature, remove its matching `.module.css` classes, any custom properties or z-index tokens it introduced, and its media-query overrides in the same change.
- **Verify after deletion**, do not assume a green build means clean. Grep the module for the removed feature's class prefix (e.g. `grep -n "sandbox" x.module.css`) and confirm zero hits.
- **Mechanical multi-file rewrites leave debt.** A regex/`sed` import swap rewrites each statement in place and can produce multiple imports from the same module. After any bulk rewrite, merge same-source imports and re-run lint. Prefer a codemod that merges, or a formatter pass, over a bare find-replace.
- **The footprint includes the DOCUMENTATION, not just the code.** Deleting a route, component, exported symbol, script, or dependency makes every doc and **rule** that describes it false in the same commit. Enumerate deletions from the diff (`git diff --name-status --diff-filter=DR`) and grep `docs/knowledge-base/`, `.agent/rules/` plus mirrored vendor rule dirs, `docs/working/`, and `docs/backlog/` with `rg --no-ignore`. Full procedure: `implement-session-land` §2.0, run at wrap-up and land. A stale spec misleads a reader; a stale **rule** instructs every future agent — a retired icon library survived in a rule long after the dependency was gone. And a deleted file named on a live ticket's `**Files**` line means that ticket's premise is dead: re-verdict it, don't leave it standing.

### Intentionally-dormant features (the inverse case)

Not every unreferenced-looking file is dead. A feature **kept on purpose but disabled** (gated behind a default-off flag, e.g. `showFilmStrip={false}`) must not be deleted as "dead code."

- **Exclude it from Fallow** by adding its path/glob to `ignorePatterns` in `.fallowrc.jsonc` (the same lever used for `interactive-career-timeline/**`), with a comment naming the owning ticket. This keeps the dead-code scan and `fallow fix` from flagging or auto-removing it.
- **Keep the owning ticket truthful.** If you disable a feature, its ticket reads "built but disabled," not "deleted." A "deleted" claim that a later restore reverses is documentation drift. State the current code reality and link the CHANGELOG entry.

### Suppression hygiene (config-only noise reduction)

When an honest `.fallowrc.jsonc` floods the scan with known-benign findings, quiet it with config levers, never source edits: `"ignoreExportsUsedInFile": true` (the demote-to-non-exported-never-delete class), `ignoreExports` by explicit name only — never `"*"` — with a cite-or-run verified test importer per name, and `duplicates.ignore` for fixture/dev-data and vendored paths. After any suppression-only change, the unused-file count must be identical before/after — that comparison is the proof no real signal was hidden — and the every-change gate tier (`foundation-testing.md` §1) still runs. Full lever contracts and the live evidence: `integrations/fallow.md` (Noise suppression).
