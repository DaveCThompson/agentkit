---
name: canonical-manifest
description: What manifest.json is, every field's single source of truth, the tier/domain routing axes, and why hand-editing it is drift. Copy-based rewrite of a predecessor kit/specs/canonical-manifest.md.
last-verified: 2026-07-31
---

# Canonical Manifest Spec

*Supersedes `a predecessor kit/specs/canonical-manifest.md` (Apr 2026). Two changes: `.agent/` singular, and
the manifest is now **compiled, never authored** (decision 28) — the old spec's hand-maintained
manifest was itself a drift source (two declarations of one routing fact).*

`manifest.json` at the kit root is the compiled index of the kit. Kit-owned self-generation,
inventory and adoption publish it; consumer sync must not write into its kit source. A hand edit
is drift. Publication belongs to the kit's tooling owner.

## One source per field

| Field | Derived from |
|---|---|
| `path`, `type`, `name` | `.agent/` file layout (`skills/<name>/`, `rules/<stem>.md`, …) |
| `tier` (`core` \| `tech:<x>` \| `kind:<x>` \| `overlay`) | SKILL/rule frontmatter `tier:`; fallback: `domain-*`/`project-*` prefix ⇒ overlay, else core; unknown tiers are invalid |
| `sha256` | file content, EOL-normalized |
| `triggers`, `appliesTo`, `requiredTools` | frontmatter (`triggers:`, `applies-to:`, `required-tools:`) |
| `conflictsWith` | the B1 routing table (authored as frontmatter `conflicts-with:` on the losing asset) |
| `generatedTargets` | computed by running each vendor adapter over the entry |
| `kitVersion` | `package.json` `version` (bumped by `adopt`: patch = content fix, minor = new asset, major = shape/contract change) |

## Two axes: `tier:` (applicability) vs `domain:` (topic)

Rule frontmatter carries **two orthogonal routing keys**. They answer different questions and
neither substitutes for the other; conflating them is the drift this section exists to prevent.

| Axis | Question it answers | Values | Who reads it |
|---|---|---|---|
| `tier:` | *Does this rule apply to this repo at all?* | `core` \| `tech:<x>` \| `kind:<x>` \| `overlay` | `sync`/`check` — gates which rules are rendered into a project at all |
| `domain:` | *Which applicable rules does THIS task need?* | the vocabulary below, exactly one per rule | `orchestrate-kickoff` Phase 2.4, via the `project-invariants.md` rule-routing table |

Orthogonal because they cut the set on unrelated planes: `tier:` is a property of the **repo**
(a repo either uses Supabase or it does not), `domain:` is a property of the **task** (a task
either touches auth or it does not). A Supabase repo still does not want `tech-supabase-auth.md`
in front of a worker doing a typography pass. Filtering runs `tier:` first, then `domain:` —
`domain:` never widens a subset past what `tier:` already admitted.

`domain:` is a **source-only** key. It lives in `.agent/rules/*.md` frontmatter; the Claude rules
adapter carries only `globs:` through (as `paths:`) and drops the rest, so `domain:` never reaches
generated `.claude/rules/*` output and is not compiled into `manifest.json` today.

### Settled `domain:` vocabulary

Exactly one value per rule, drawn from this closed set:

| `domain:` | Covers |
|---|---|
| `a11y` | WCAG conformance, semantics, focus, assistive-tech behavior |
| `code-quality` | Language/typing conventions, source organization, behavior-preserving refactors |
| `design-system` | Token contract, theming, semantic-token parity |
| `docs` | Tickets, plans, changelog, the docs directory model |
| `error-handling` | Error/empty/loading states, validation, network-failure resilience |
| `git` | Branching, committing, merge/conflict protocol |
| `layout` | Page composition, structure, navigation, interactive controls, interaction states |
| `motion` | Animation libraries and timeline/reveal orchestration |
| `orchestration` | Parallel agents, wave tickets, worker↔orchestrator contracts |
| `performance` | Load/runtime cost, asset and media pipelines, render loops |
| `security` | Secrets, authn/authz, hardening, outward-facing mutation |
| `state` | State containers, derived state, data/prop flow |
| `testing` | Verification gates, test authoring, QA workflow |
| `tooling` | Shell/command shape, workspace and build surface |
| `transport` | Data layer — network, DB access, schema/migrations, caching and offline |

Two of these are additions to the vocabulary the routing ticket proposed; each closes a gap the
proposed set could not express without misfiling a rule:

- **`design-system`** — the proposed set had `layout` (structural composition) but nothing for the
  token/theming contract. Filing `foundation-design-tokens.md` under `layout` pollutes the layout
  subset for every page-composition task and still leaves a token-touching task without a precise
  subset.
- **`code-quality`** — `tooling` means the agent's command and workspace surface, not source-code
  conventions. Typing and refactor-hygiene rules had no home that did not distort `tooling`.
- Dropped from the proposed set: nothing. `transport, state, security, a11y, error-handling,
  motion, performance, docs, orchestration, testing, git, layout, tooling` all survive and all are
  in use — no term in the closed set is dead.

## What consumes it
- `check` — hash comparison and the overlay↔core collision lint.
- `doctor` — fleet diagnostics and declared tool probes. It does not prove semantic orthogonality,
  infer tool selection from every skill dependency or certify native generated-output behavior.
- Phase gates — the routing-disambiguation test reads `triggers` to build ambiguous-prompt probes.

## Project-side files (for contrast)
- `.agentkit.json` — **project intent**: vendors, stack/kinds, tools, overlays, capability exclusions,
  optional `docs.kbRoot` and optional `vendorDefaults`. Hand-authored; legacy nonempty/malformed pins
  are rejected.

  `vendorDefaults` selects per-vendor scalar preferences from a closed allowlist and is default-off.
  Its authority boundary and the full key table live in `DECISION-settings-key-merge-scope.md`.

  ```json
  "vendorDefaults": {
    "claude": { "outputStyle": "flat-technical", "model": "<model id>" },
    "codex":  { "model": "<model id>", "modelReasoningEffort": "<effort>",
                "subagentModel": "<model id>", "subagentReasoningEffort": "<effort>",
                "subagentWaitTimeoutMs": 900000 }
  }
  ```

  Two conditions an author must know, because neither is visible in a clean sync:

  - **`outputStyle` must name a style the project actually selects.** Sync refuses one that does not,
    rather than writing a setting that silently does nothing.
  - **Codex reads project config only in a trusted project.** An untrusted project gets a correct
    file, a clean sync, a clean drift check, and no effect. The kit cannot observe trust, so it
    reports what it generated and does not claim the values are live.

  `subagentWaitTimeoutMs` maps to Codex's `default_wait_timeout_ms`, which bounds how long a wait
  call blocks. Whether a longer window lengthens an orchestrator's check cycle is unverified; name it
  a timeout, not a polling interval.
- `.agentkit.lock` — **completed shipped state**: hashes, source/transform identity, kit version and
  typed settings ownership. Machine-written, committed by consumers, never hand-edited.
- `.agentkit.pending.json` — private incomplete-operation recovery, excluded from Git. It is not
  portable completed ownership or a version cache; retain it until recovery/finalization is verified.
