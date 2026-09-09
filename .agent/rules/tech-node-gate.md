---
trigger: always
tier: kind:app
domain: testing
---

# Node & TypeScript Verification Gate

Use this rule when the project actually uses Node/TypeScript tooling. App-kind selection does not
prove that stack; non-JS applications use their own commands. `foundation-testing.md` owns applicable
proof and receipt reuse. This rule supplies JS/TS mechanics, not extra acceptance requirements.

## 1. Graduated Verification Gate — Node/npm Specifics
- **`gate:*` npm-script convention.** The convention is `gate:lint`, `gate:types`, `gate:test`,
  `gate:build`, and an aggregate `gate` that chains them, wired into `package.json`. Run a tier as
  `npm run gate:types` (or the whole gate as `npm run gate`) — the single, prefix-matchable command
  form when those scripts exist. Otherwise use the actual project commands. Adding gate scripts
  is a scoped tooling change, not a prerequisite for diagnosing, testing or documenting a project.
- **`tsc -b` vs `tsc --noEmit`:** inspect the project's reference graph and configured scripts.
  Build mode processes references in dependency order; emit and incremental artifacts depend on
  compiler version/configuration. A single-project no-emit check may consume stale dependency
  declarations rather than rebuilding them. Verify the relevant cross-package state and actual
  outputs; `--noEmit` does not guarantee that incremental bookkeeping writes nothing.
- **Windows-portable heap bump.** `NODE_OPTIONS=… tsc` breaks on Windows `cmd` (the inline env-var
  prefix isn't parsed there). The portable form runs identically on POSIX and Windows:
  `node --max-old-space-size=8192 node_modules/typescript/bin/tsc --noEmit`. Prefer it in any
  `package.json` `typecheck`/`build` script that needs a heap bump, so the same script works fleet-wide.
  The same OOM risk shows up inside a git hook: on large branches, husky/lint-staged running
  type-aware `eslint --fix` can OOM (`Fatal process out of memory: Zone`) — lint-staged then
  silently auto-reverts and leaves an orphan backup stash (see `git-protocol.md` §2). Inside a git
  hook, first inspect which process failed and whether an owned script can set its memory limit.
  If using `NODE_OPTIONS` for an authorized command, preserve existing options, scope the change
  to that process or restore the previous environment afterward. Choose a justified limit; do
  not disable hooks, lose a backup stash, or infer commit authority from a troubleshooting recipe.

## 2. Know Where Tests Are Collected — Alias Mirroring
Mirror tsconfig path aliases in the test-runner config (e.g. vite-tsconfig-paths); a test importing
through an unmirrored or divergent alias fails at collection — or silently resolves the wrong module.
(See `foundation-testing.md` §5 for the neutral collection principle this refines.)

## 3. Determinism & Mock Quality — E2E (Playwright/TypeScript)
Type the `page` param (no `any`) — the Playwright/TypeScript-specific piece. The credential-hygiene
and deterministic-state principles are stack-neutral and live solely in `foundation-testing.md` §7;
this rule does not restate them.

## 4. Standards
See `pattern-code-standards.md` for test file naming (`.test.tsx`, `.adversarial.test.tsx`) and
`describe`/`it` naming conventions.
