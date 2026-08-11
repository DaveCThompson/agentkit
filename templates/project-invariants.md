---
trigger: always
---

<!-- TEMPLATE — copy to `.agent/rules/project-invariants.md` in a project and fill in.
     This is a PROJECT-OWNED rule (project-*/domain-* are yours; foundation-*/tech-*/pattern-* are
     kit-owned). It is the delegation target for kit-core rules: when a shared rule states a principle
     generically ("barrel files re-export a feature's public surface"), the CONCRETE paths and scopes
     for THIS repo live here. Core rules reference it by bare name — `project-invariants.md` — so keep
     that name. Keep every entry a verifiable one-liner; if a fact needs a paragraph of rationale it is
     probably a `DECISION-` or a spec, not an invariant. -->

# Project Invariants — <PROJECT NAME>

The concrete, load-bearing facts of this repository that kit-core rules delegate to. One-liners only.

## Source layout
<!-- The real roots for THIS repo (Vite SPA `src/`, Next.js `app/ components/ lib/`, monorepo
     `apps/<app>` + `packages/*`, …). The scope agents and `verify-rules` should search. Mirror these
     into `.agentkit.json` `sourceRoots` so the content-integrity guard and verify-rules read one scope. -->
- **Source roots:** `<e.g. src/  |  app/ components/ lib/  |  apps/<app>/ packages/*>`
- **Feature/module roots:** `<e.g. src/features/*  |  app/(routes)/*>`
- **Shared UI primitives:** `<e.g. src/shared/ui/*  |  components/ui/*>`
- **Barrel/index convention:** `<e.g. each feature exposes a public surface via index.ts, or "no barrels">`

## Design tokens / styling
- **Token definition files:** `<e.g. src/styles/{primitives,semantics}.css>` — the machine-read exclude for `agentkit verify` is `.agentkit.json` `verify.exclude` (this line is the human pointer). The color checks already default-exclude `**/primitives.css`, `**/semantics.css`, `**/*.tokens.css` and test files, so only a *non-conventionally-named* token file needs adding to `verify.exclude`.
- **Token pipeline scripts:** `<e.g. npm run validate:tokens → src/scripts/validate-tokens.js, or "none">`
- **Branding assets:** `<e.g. src/assets/branding/, src/config/branding-config.ts, or "none">`

## State / data
- **State location + pattern:** `<e.g. src/state/ (jotai atoms)  |  Redux slices  |  none>`
- **Schema/validation location:** `<e.g. src/schemas/, Zod  |  none>`
- **Error/loading primitives:** `<e.g. src/shared/ui/{ErrorState,EmptyState,Skeleton}  |  none>`

## Error / telemetry stack
- **Error reporting:** `<e.g. Sentry via componentDidCatch  |  none>`
- **HTTP client + timeout:** `<e.g. axios, 15s  |  fetch  |  n/a>`
- **App shell / loading tiers:** `<e.g. index.html shell → AppShellSkeleton → per-page skeletons  |  n/a>`

## Knowledge base
- **KB spec/strategy docs core rules may point at:** `<e.g. docs/knowledge-base/SPEC-*, STRATEGY-*  |  none yet>`

## Tool blind spots
<!-- "Tool X cannot see Y" — pre-document each tool gap the first time it burns you, so every
     future audit can dismiss the known false positive in seconds instead of re-deriving it. -->
| Tool | Cannot see | Consequence / known false positive |
| :--- | :--- | :--- |
| `<e.g. static token scan>` | `<e.g. custom properties injected at runtime by TS setters>` | `<e.g. flags them as phantom tokens — verify the setter before filing>` |
| `<e.g. rg / Grep (default ignores)>` | `<e.g. anything under docs/working/evidence/ or docs/archive/>` | `<e.g. "zero matches" is not proof of absence — re-run with --no-ignore>` |

## Doc routing (category → docs)
This table is consumed verbatim by `orchestrate-kickoff` Phase 2.4, which injects the matching
rows into each worker's launch block and hardcodes no rows itself — an empty table means workers
get no doc onboarding.

| Category | Docs to read |
| :--- | :--- |
| `<e.g. layout>` | `<e.g. docs/knowledge-base/SPEC-design-system.md §layout>` |
| `<e.g. transport/state>` | `<e.g. project's data-layer doc>` |
| `<e.g. testing>` | `<e.g. project's test-strategy doc, or "none">` |

## Rule routing (task type → rule subset)
Companion to the table above, consumed the same way by `orchestrate-kickoff` Phase 2.4. Every
`.agent/rules/*.md` file carries exactly one `domain:` topic tag; `governance/canonical-manifest.md`
holds the closed vocabulary and the axis split. `tier:` decides *whether* a rule applies to this
repo, `domain:` decides *which* of the applicable rules a given task should be handed — so filter
by `tier:` first, then by `domain:`, and drop any row naming a rule this repo's stack does not
install (a repo without Supabase simply has no `tech-supabase*.md`).

These rows are already concrete and may be injected into a launch block verbatim. They cover the
kit-owned rules only — append your `project-*` / `domain-*` rules to the right-hand column as you
write them.

| Task type | `domain:` | Rules to read |
| :--- | :--- | :--- |
| Build or restyle a UI surface | `layout`, `design-system` | `pattern-structure.md`, `pattern-inputs.md`, `pattern-interactions.md`, `pattern-navigation.md`, `foundation-design-tokens.md`, `foundation-design-system.md`, `pattern-design-parity.md` |
| Data, API, or persistence change | `transport`, `state` | `tech-supabase.md`, `tech-supabase-migrations.md`, `foundation-pwa.md`, `pattern-state.md`, `pattern-component-props.md` |
| Auth, secrets, or permissions | `security` | `foundation-security.md`, `pattern-external-mutation.md`, `tech-supabase-auth.md`, `kind-service-containers.md` |
| Animation or per-frame rendering | `motion`, `performance` | `pattern-motion.md`, `tech-framer-motion.md`, `tech-canvas-rendering.md`, `foundation-performance.md` |
| Bug fix or verification-gate work | `testing`, `git` | `foundation-testing.md`, `tech-node-gate.md`, `tech-python-gate.md`, `foundation-browser-usage.md`, `git-protocol.md` |
| Behavior-preserving refactor | `code-quality` | `pattern-refactoring.md`, `pattern-code-standards.md`, `tech-typescript.md`, `tech-react.md`, `pattern-feature-scaffolding.md` |
| Error, empty, or loading states | `error-handling` | `pattern-error-handling.md` |
| Accessibility pass | `a11y` | `foundation-accessibility.md` |
| Asset or media pipeline work | `performance` | `pattern-assets.md`, `foundation-performance.md` |
| Docs, ticket, or changelog edit | `docs` | `pattern-docs-artifacts.md` |
| Launching or working a wave | `orchestration`, `tooling` | `pattern-agent-orchestration.md`, `pattern-command-shape.md`, `pattern-monorepo.md` |

<!-- Add sections only as core rules delegate to them. Delete any section this repo doesn't use —
     an empty placeholder is worse than an honest omission. -->
