---
trigger: always
tier: kind:app
domain: testing
---

# Node & TypeScript Verification Gate

App-kind repos build on Node/npm — this rule holds the JS/TS-specific verification mechanics that
`foundation-testing.md` keeps neutral. Wherever that rule says "adapt to the project's
lint/typecheck/test/build equivalents" (e.g. adapting command names like `<pkg> run lint`,
`<test-runner> run …` to the project), this is what that adaptation looks like for Node/npm.

## 1. Graduated Verification Gate — Node/npm Specifics
- **`gate:*` npm-script convention.** The convention is `gate:lint`, `gate:types`, `gate:test`,
  `gate:build`, and an aggregate `gate` that chains them, wired into `package.json`. Run a tier as
  `npm run gate:types` (or the whole gate as `npm run gate`) — the single, prefix-matchable command
  form `foundation-testing.md` §1 requires. A project without `gate:*` scripts should add them
  (`agentkit init` scaffolds them into an existing `package.json`); until then, adapt the tier
  command names but keep the one-command shape.
- **`tsc -b` vs `tsc --noEmit`:** `tsc -b` builds project references in dependency order and emits
  `.tsbuildinfo` + declaration outputs; a monorepo with project references NEEDS it — plain
  `--noEmit` checks one project against possibly stale `.d.ts` output of its dependencies and can
  pass on broken cross-package types. `tsc --noEmit` is the pure, artifact-free typecheck for
  single-project repos. Use whichever the project's `typecheck` script wires; if writing one:
  `-b` when `references` exist, `--noEmit` otherwise.
- **Windows-portable heap bump.** `NODE_OPTIONS=… tsc` breaks on Windows `cmd` (the inline env-var
  prefix isn't parsed there). The portable form runs identically on POSIX and Windows:
  `node --max-old-space-size=8192 node_modules/typescript/bin/tsc --noEmit`. Prefer it in any
  `package.json` `typecheck`/`build` script that needs a heap bump, so the same script works fleet-wide.
  The same OOM risk shows up inside a git hook: on large branches, husky/lint-staged running
  type-aware `eslint --fix` can OOM (`Fatal process out of memory: Zone`) — lint-staged then
  silently auto-reverts and leaves an orphan backup stash (see `git-protocol.md` §2). Inside a git
  hook you cannot use the direct `node --max-old-space-size=…` form above (git invokes the hook
  chain; you don't control the binary invocation) — instead use the env-var form for the COMMIT
  process itself: PowerShell `$env:NODE_OPTIONS='--max-old-space-size=8192'; git commit …` / cmd
  `set NODE_OPTIONS=--max-old-space-size=8192 && git commit …` / POSIX inline
  `NODE_OPTIONS=--max-old-space-size=8192 git commit …`.

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
