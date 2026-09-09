---
trigger: glob
tier: tech:typescript
globs: "**/*.ts"
domain: code-quality
---

# TypeScript & Invariants

Express the intended contract in types and enforce untrusted-data boundaries at runtime.
Use the project's compiler, module and testing configuration; TypeScript alone does not require
a centralized type tree, a barrel import or a particular UI test selector.

## 1. Type Safety

- Prefer precise types, `unknown` at untrusted boundaries and discriminated narrowing over
  `as any` or unchecked assertions. A type assertion does not validate runtime data. Where an
  interop boundary needs an escape hatch, keep it narrow, explain the limitation and test it;
  do not weaken unrelated checks or require unrelated type migrations.
- Narrow from actual discriminants and validate values before treating them as trusted models.
  A user-defined predicate can misrepresent runtime behavior; check its implementation and
  invalid-input cases, not just its return annotation.
- Keep shared types/guards with the contract they own. Reuse a common definition when meanings
  match; do not centralize every type or guard. Inspect dependency direction and runtime imports
  when extracting modules, because a centralized module does not itself prevent cycles.
- Check exhaustiveness for closed unions at the appropriate boundary, for example with a
  `never` assertion after narrowing. A reducer intentionally accepting unknown/external actions
  may need to return unchanged state or validate/reject at ingress. Do not replace that contract
  with an unconditional throwing default. Preserve production enforcement for invalid operations.

See [TypeScript narrowing and exhaustiveness](https://www.typescriptlang.org/docs/handbook/2/narrowing.html).
Use `foundation-security.md` for trust boundaries and `pattern-code-standards.md` for
risk-sensitive invariant failure behavior.

## 2. Constants & Imports

- Name consequential literals with their units and meaning. Keep them local unless consumers
  share ownership and change semantics; repeated values alone do not require global constants.
- `as const` objects and derived unions are useful for literal APIs. Enums are also supported;
  follow project policy and preserve serialization, emitted values and external compatibility.
  Do not migrate existing enums as incidental cleanup. See `pattern-code-standards.md` §6.
- Use the established public module/package entry point. An existing barrel can be the intended
  API; a direct import can avoid a cycle, preserve a boundary or suit tooling. Inspect actual
  exports and side effects before choosing. Do not reach into undocumented package internals.
  See `pattern-code-standards.md` §4 and `foundation-performance.md` Bundle Size.
- Match import spelling and casing to the real filesystem/package exports. Follow the project's
  naming scheme and module-resolution settings. `forceConsistentCasingInFileNames` helps catch
  casing mismatches; it does not impose lowercase or kebab-case filenames.

## 3. Testing & QA

- Run the actual typecheck/lint/test/build commands needed by the changed contract. Do not assume
  a build runs TypeScript checking or that every project has `npm run lint`. Inspect applicable
  `tsconfig` files, included sources and compiler options before reporting coverage.
- For UI tests, prefer queries by role/name, label or another user-observable contract. Test IDs
  are useful for stable distinctions unavailable through those queries, but they are not required
  on every interactive element or a substitute for accessible semantics. Respect an explicit
  project selector contract without expanding it into all TypeScript work.
- Give wrapped components useful diagnostic names where tooling would otherwise obscure them.
  A universal `forwardRef`/displayName prescription is not a type-safety requirement; use the
  installed React/library contract in `tech-react.md`.

See [Testing Library query guidance](https://testing-library.com/docs/queries/about/) and
[TypeScript import-casing checks](https://www.typescriptlang.org/tsconfig/forceConsistentCasingInFileNames.html).

## 4. Git & Recovery

For diagnostics that remain after a move/deletion, first check current imports, generated types,
included files, references and the actual compiler output. If command-line evidence and editor
state disagree, refresh the applicable language service/cache through the installed tool.
Do not assume VS Code or treat a restart as proof that a real error is repaired.

Preserve the owned diff and concurrent work before recovery. Compare the intended revision and
exact paths read-only, then use an authorized scoped repair/reversal with the actual change visible.
Do not restore a whole file from a historical commit over uncommitted work as an automatic
refactor recipe. Git does not preserve every ignored/untracked/local state.
Shared-tree workers leave Git operations to the coordinator; `git-protocol.md` and
`foundation-testing.md` own recovery authority and evidence.

## 5. Verification

### Invariants (Automated)

- Check actual compilation/collection and relevant lint diagnostics against configured source
  roots. Record excluded projects/generated declarations and whether strict/null/implicit-any
  checks apply; a generic green build does not prove every file was checked.
- Use the configured compiler/linter for narrowing, unsafe assertions, module resolution and
  casing. Search results locate candidates, not proof of runtime validation or a universal ban.
- Test predicates and input validation at their real boundary with legitimate and malformed
  values when that behavior changes. Test intended default handling for open action sets.

### Logic (Manual/Reasoning)

- Do type definitions describe the real runtime contract, including absent/error states?
- Are union exhaustiveness, exception behavior and external compatibility preserved?
- Do shared types, constants and imports reflect ownership without introducing cycles?
- Do tests establish behavior through a stable contract, and are missing proof lanes explicit?

## See Also

- `pattern-code-standards.md` — file organization, types and constants as project defaults.
- `foundation-design-tokens.md` — actual token definitions and scoped literal checks.
- `tech-react.md` — React state, identity and composition.
- `foundation-testing.md` — evidence validity and appropriate verification.
