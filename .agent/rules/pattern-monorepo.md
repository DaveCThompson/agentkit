---
trigger: model-decision
description: Consult before cross-package imports, workspace-scoped script runs, or edits in a multi-workspace repo — one-way dependency direction, sideEffects declarations, tsc -b build order, path-aware edits.
domain: tooling
---

# Monorepo Awareness

Respect the repository's actual workspace ownership, dependency graph and public package contracts.
A successful local import can still break packaging or consumers. Discover roots, names and
build orchestration from the configured workspace system and project guidance.

## 1. Dependency Direction Is One-Way

- Preserve the established dependency direction. In a layered app/shared-core design, importing
  an app into core introduces unwanted coupling; inspect the actual graph rather than assuming
  every repository uses those layers or that every such edge breaks all builds.
- Prefer a suitable existing abstraction or a stable extension/composition contract. Consumer-specific
  branching in a shared package deserves review, but copying a shared file is not the automatic
  escape hatch. Justified local duplication needs semantic ownership and convergence reasoning
  under `pattern-feature-scaffolding.md` and `pattern-refactoring.md`.
- Check public exports, package dependencies, runtime versus type-only edges and cycles before
  cross-package imports. Do not bypass package APIs with private source paths for convenience.

## 2. Per-Workspace Scripts & `sideEffects`

- Use `sideEffects` only where the bundler/package contract supports it, with an accurate value.
  `false` can remove needed CSS, polyfills, registrations or initialization. Match the emitted
  files and test a minimal production consumer; do not set it mechanically on every workspace.
  See [webpack tree shaking](https://webpack.js.org/guides/tree-shaking/).
- Run focused checks on affected packages and consequential consumers during iteration. A shared
  contract change can require wider downstream proof; inspect the affected graph and explain
  exclusions. Local package success alone is insufficient for a consumer-compatibility claim.
- The final integrated broad gate remains with its owner under `foundation-testing.md`.
  Workspace scoping is not an exemption from final-tree acceptance.

## 3. Project References & Build Order

- When the TypeScript project uses references, use its actual build-mode/orchestrator contract.
  `tsc -b` orders referenced projects and checks which need rebuilding; it does not universally
  rebuild every downstream package after every upstream edit.
- Other workspaces may use source imports, another language or a different build graph. Do not
  impose TypeScript references merely because multiple packages exist.
- Diagnose stale output against real input/output and cache contracts. Regenerate only through the
  authorized owner, without broad cleanup or suppressing unexplained errors. Build mode/incremental
  tooling can write outputs or caches even for verification; account for that scope.
  See [TypeScript project references](https://www.typescriptlang.org/docs/handbook/project-references.html).

## 4. Path-Aware Edits

- Resolve a file's owning workspace before editing similarly named barrels/utilities. The nearest
  `package.json` is a clue for Node, not a universal ownership oracle; check workspace membership,
  nested package boundaries and explicit assignments.
- When reusing styles, trace token semantics and values in the destination. Identical names do not
  ensure identical meaning. Verify supported themes and relevant rendered states.

## 5. Verification

- [ ] Actual edits belong to the assigned workspace/surface.
- [ ] Dependency direction, exports and required consumer compatibility are preserved.
- [ ] Focused affected-graph checks ran with true results; wider required proof and its owner are named.
- [ ] Any changed `sideEffects` declaration preserves required production imports and behavior.
- [ ] Build/cache effects stayed inside authorization; no whole-tree cleanup was inferred.
