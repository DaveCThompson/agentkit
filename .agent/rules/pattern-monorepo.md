---
trigger: model-decision
description: Consult before cross-package imports, workspace-scoped script runs, or edits in a multi-workspace repo — one-way dependency direction, sideEffects declarations, tsc -b build order, path-aware edits.
domain: tooling
---

# Monorepo Awareness

In a workspace/monorepo, respect package boundaries and the dependency direction — a boundary
violation compiles fine today and becomes an import cycle, a broken tree-shake, or an
un-releasable package later. Apply this rule whenever the repo has multiple workspaces; the
repo's actual workspace layout, package names, and roots live in `project-invariants.md`.

## 1. Dependency Direction Is One-Way
- Apps and domain slices import shared/core packages. A shared/core package must **never**
  import an app or domain slice — that inversion couples the kernel to one consumer and breaks
  every other consumer's build graph.
- **A kernel that grows consumer-specific branches is a defect.** The eject hatch: a consumer
  that genuinely must diverge copies the shared file into its own slice and owns it. The shared
  package never accepts a one-consumer branch.
- New cross-package imports are architecture decisions, not conveniences — check the direction
  before adding one.

## 2. Per-Workspace Scripts & `sideEffects`
- Every workspace `package.json` declares a `sideEffects` field so bundlers can tree-shake
  unused exports. Set it when the package is created, not retrofitted after a bundle audit.
- Run lint/typecheck/test/build **scoped to the affected workspaces**, not the whole tree —
  full-tree runs on a leaf change waste time and bury the relevant failure.
- **Exception:** when a shared package changes, run the whole downstream graph. A green build in
  the shared package alone proves nothing about its consumers.

## 3. Project References & Build Order
- Use `tsc -b` (project references) for typecheck/build across packages so the compiler walks
  the dependency graph in order instead of type-checking against stale output.
- Understand build order: a shared-package change invalidates and forces rebuilds of everything
  downstream. Stale `dist/` output from a skipped rebuild produces phantom type errors that
  "fix themselves" later — rebuild, don't suppress.

## 4. Path-Aware Edits
- Know which workspace a file belongs to **before** editing. The same relative path (an index
  barrel, a utils formatter) can exist in several packages; an edit landed in the wrong twin
  passes review and silently changes the wrong surface.
- Resolve ambiguity from the file's nearest `package.json`, not from the path fragment alone.
- The same applies to design tokens: when you vendor or clone styling from another repo or design
  system, an identical token name may resolve to a different value — or render invisibly — in the
  target; verify rendered output in both themes, not just that names match.

## 5. Verification
- [ ] Edits stayed within the intended workspace (nearest `package.json` confirms ownership).
- [ ] Dependency direction preserved — no shared/core file imports an app or domain slice.
- [ ] Affected-workspace lint/typecheck/tests/build ran; full downstream graph ran if a shared
      package changed.
- [ ] Any new package declares `sideEffects` in its `package.json`.
