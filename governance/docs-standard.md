# Docs / KB / CHANGELOG Standard

> The canonical standard for how every kit-managed project structures `docs/`, writes its
> `CHANGELOG.md`, and keeps its knowledge base honest and routable. Implements
> CONSOLIDATION-PLAN decisions **20–24, 31, 35** and the Phase-D detail section.
>
> `last-verified: 2026-07-03`
> Exemplars canonized here: a representative project's `CHANGELOG.md` (dialect + roll mechanics),
> a representative project's `docs/knowledge-base/README.md` (trigger index + drift markers),
> and a representative project's convention doc (four-directory base).

Templates that implement this standard live in `templates/docs-scaffold/`, `templates/kb-doc.md`,
`templates/project-CHANGELOG.md`, and `templates/project-AGENTS.md`. This doc is the *why and the
rule*; those are the *fill-in*.

---

## (a) The four-directory model and the five-store purity test

Every project's `docs/` uses exactly four directories. No fifth, no nesting exceptions except those
named below.

```
docs/
├── knowledge-base/     # Durable project truth (flat by default; nest only for a large single-topic library — §c)
├── working/            # Active tickets/plans/reviews — flat, no nesting
├── backlog/            # Not-yet-started items — flat, no nesting
└── archive/YYYY-MM/    # Completed work, grouped by month — flat within each month
```

Alongside `docs/` at the repo root: `CHANGELOG.md` (the rolling event log — see section b) and
`AGENTS.md` (the entrypoint — see `templates/project-AGENTS.md`).

### This standard is the canon — a project does not hand-write a second copy

The synced rule (`pattern-docs-artifacts.md`) and this document are the model. A project-local
"docs-structure convention" doc that **paraphrases** them is drift by construction: it is a
hand-maintained duplicate of a generated file, and the two disagree the first time either changes.
Live evidence: a project's convention doc and its synced artifacts rule disagreed on the
working-directory prefix canon, and the convention doc did not know `docs/knowledge-base/research/`
existed at all. If a project wants a convention doc, it **points** here; it does not restate.

### The five-store purity sentence — the test every promotion runs against

> **Rules = what an agent must DO · KB = what IS true · CHANGELOG = what WAS done ·
> working = what's IN FLIGHT · archive = what's FINISHED (disposable).**

Before any file lands in the KB, run it against all five stores. It belongs in the KB **only if it
is a durable statement of what is true** about the project. If it fails all five tests — it is not a
behavior, not a truth, not an event, not in-flight, not finished work — it is **evidence**, and
evidence never lives in the KB (see section f).

Worked applications of the test (all backed by prior project evidence):
- A raw multi-model research dump (`A2-2-DOMAIN-HR-CHATGPT.md`) — not a truth, it is source material
  an agent synthesized *from*. → evidence, quarantine out of KB. (prior audit evidence)
- A testimonial bank / person profile (`testimonial-bank.md`, `person-profile.md`) — product
  content, not project-standard truth. → evidence/content store, not KB.
  (prior audit evidence)
- A session log (`LOG-2026-07-*.md`) — an event record of finished work. → archive, after harvesting
  any durable fact it contains into the KB. (prior audit evidence)
- A settled architectural question ("do we use junctions or generated files?") — a truth going
  forward. → KB as a `DECISION-` doc (see section c).

### The expiry-trigger test — which store a typed doc belongs to

The purity sentence asks *what a doc is*; this test asks *what event makes it stale*, and the answer
names its store with no special cases (decided 2026-08-01, `F-prd-store-lifecycle`):

| The doc expires when… | Store | Types |
|---|---|---|
| the **behavior changes** | KB | `SPEC-`, `RUNBOOK-` |
| the **direction pivots** | KB | `STRATEGY-` (incl. vision), `DECISION-` |
| the **work lands** | lifecycle (`working/`/`backlog/`) | `TICKET-`, `PLAN-`, `IDEA-`, `ROADMAP-`, `PRD-` |
| it is **adjudicated/absorbed** | evidence (§f) | `RESEARCH-` |

The KB holding pivot-expiry docs is not a violation of "the KB states what IS true": a vision or
strategy doc is a **present-tense fact about commitment** — "we are building toward X" is true
today even though X describes the future. What the KB never holds is landing-expiry content: a doc
that stops being true the moment the work ships is a plan, wherever it was filed.

**The PRD dissolution contract.** A PRD is the bridge between the two KB truths — it slices the
vision and specifies one iteration's to-be precisely. It is born in `working/` (or `backlog/`),
and it is a **composite**, so on landing it is *dissolved, never parked whole in the KB*:

1. **Landed subset** → the `SPEC-` (update or create), written in as-is voice — what shipped, not
   what was asked; divergences recorded as reality (with a `DECISION-` if the call meets §c's bar).
   The spec may start as soon as any coherent slice is real; it need not wait for the PRD to close.
2. **Unlanded remainder** → back to `STRATEGY-`/vision if it is direction, or a `backlog/` ticket
   if it is committed near-term work.
3. **The record** → `docs/archive/YYYY-MM/` with a closing header: what landed (SHAs), where each
   remainder went, `superseded-by:` the spec.

Promoting a PRD whole puts to-be content in as-is space: the KB then asserts behaviors that were
never built, and agents that trust the KB — which is what the KB is for — build on them. This is
the same harvest rule the wrap-up applies to session docs, applied to requirements.

---

## (b) The single CHANGELOG dialect + the hard roll rule (harvest first)

There is **one** CHANGELOG dialect fleet-wide: the selected exemplar
(the fleet's gold candidate). Four dialects existed pre-consolidation
(CONSOLIDATION-PLAN L13); this is the survivor.

### Dialect

```
# Changelog                          ← H1 title is mandatory

## [YYYY-MM-DD] — Short title
<1–3 sentence session summary: what/why + link to the session log or working doc>

### Added / Changed / Fixed / Removed      ← only the sections that apply
- **`path/name`** — what and why (one line each)

### Verification
- exact commands run (lint/typecheck/build/test + counts); explicit "not staging-verified";
  named deferred follow-ups.

KB consulted: <docs read this session, or "none">
```

Two blocks are load-bearing and distinguish this dialect from the rest of the fleet:
- **`### Verification`** — near-universal in the exemplar (12 of 15 live entries; audit L173). It is
  what makes an entry trustworthy rather than a claim.
- **`KB consulted:`** — zero-ceremony read telemetry (decision 21). Agents already write entries at
  wrap-up; this one line lets `agentkit doctor` report never-cited KB docs. `none` is a valid,
  honest value.

### The hard roll rule — harvest, THEN archive

When `CHANGELOG.md` exceeds **~400 lines**:

1. **HARVEST FIRST.** Read the entries about to be rolled and extract any durable fact into the KB
   (a spec update, a new `DECISION-`, a corrected truth). **Rolling without harvesting is truth
   deletion** (decision 22) — a prior archive proved the failure mode: hundreds of archived files,
   raw session logs that rode to the archive with their durable learnings never distilled.
2. **THEN archive.** Move the rolled entries to `docs/archive/YYYY-MM/CHANGELOG-YYYY-MM.md` with a
   dated banner explaining the cut point (for example, "Changelog Archive (Pre-May 18, 2026)").
3. **Leave a provenance backlink.** The live CHANGELOG keeps a one-line pointer to the archive chain;
   the archive footer back-links to any prior-repo archive so the chain is never broken
   so the chain is never broken.

The live file is a rolling window (~400 lines / ~last month), never a permanent ledger.

---

## (c) KB taxonomy — prefixes, kebab-case, no spaces

KB documents are named with a semantic prefix (the consolidated project taxonomy, extended with
`DECISION-` per decision 24):

| Prefix | Holds |
|---|---|
| `SPEC-` | A feature/system specification — the contract for how something works **now** (as-is voice; absences stated plainly; points at strategy for direction, never contains it). |
| `STRATEGY-` | A strategy, direction, or **vision** doc — the to-be state as a present-tense commitment (§a expiry-trigger test). No separate `VISION-` prefix: same store, same expiry profile; mint one only if real docs accumulate where the distinction pays. |
| `RUNBOOK-` | An operational procedure (deploy, testing, asset pipeline). |
| `DECISION-` | A settled question, so agents stop re-litigating it. Body = **Status · Context · Decision · Consequences.** |

(`PRD-` moved to the lifecycle registry 2026-08-01 — a PRD expires on landing and is dissolved,
never parked whole in the KB; the contract is §a.)

**The `DECISION-` admission test (all three must hold).** A settled question earns its own
`DECISION-` doc only if it is (1) **hard to reverse**, (2) **surprising without context** — a
future reader meets the code and asks "why on earth is it done this way?", and (3) **the result of
a real trade-off** with genuine alternatives. If it is easily reversible, unsurprising, or had no
real alternative, it is not a `DECISION-` — small locked invariants stay one-liners in
`project-invariants.md` or a spec section. Keep the doc small: a one-paragraph Context is fine;
optional `Options` / `Revisit trigger` sections only when they add value. Immutable once
`status: accepted` — supersede with a new file, never edit the rationale. (Rationale + weighted
scoring: `ANALYSIS-2026-07-03-doc-taxonomy-industry-practice.md`, `REVIEW-taxonomy-recommendation.md`.)

### The full type registry

Lifecycle types live in `working/ backlog/ archive/` (never the KB); evidence lives in
`docs/raw-research/` or `archive/`, except the promoted `RESEARCH-` tier which lives in
`docs/knowledge-base/research/` (§f):

| Prefix | Layer | Holds |
|---|---|---|
| `TICKET-` | lifecycle | A unit of work. Junior-pack sections (`## Plan` / `## Changes` / `## Acceptance`) inside a single `TICKET-` file are sanctioned — no forced `TICKET`+`PLAN` split. |
| `PLAN-` | lifecycle | An execution plan; living while active (fold status back per phase). |
| `IDEA-` | lifecycle (backlog) | A not-yet-committed proposal. |
| `REVIEW-` | lifecycle | An assessment / vet / audit (`REVIEW-vet-*`, `REVIEW-audit-*` subtypes). |
| `LOG-` | lifecycle | A session / event record. |
| `NARRATIVE-` | lifecycle | A post-implementation narrative (replaces `WALKTHROUGH-`). |
| `PRD-` | lifecycle | One iteration's requirements — a spec of the **to-be**, born in `working/`, dissolved on landing per §a (landed → `SPEC-`, unlanded → strategy/backlog, record → archive). |
| `ROADMAP-` | lifecycle | A sequenced plan of what is intended to land when — stale by design as items land. (In the store map since 2026-07-25; registered here 2026-08-01.) |
| `RESEARCH-` | evidence | A raw dump / corpus — source material, never a contract. |

### Alias table (the taxonomy lint maps these, warn-only)

| Observed | Canonical |
|---|---|
| `ARCH-` / `ARCHITECTURE-` | `SPEC-` (durable contract) or `PLAN-` (execution pairing) — content decides |
| `VET-`, `AUDIT-`, `REPORT-` | `REVIEW-` (subtype in the tail) |
| `WALKTHROUGH-` | `NARRATIVE-` |
| `PROPOSAL-`, `EXPLORE-` | `IDEA-` |
| `SPIKE-`, `HARVEST-`, `PROMPT-RESEARCH-`, `SYNTHESIS-` (raw half) | `RESEARCH-` |
| suffix forms (`*-spec.md`, `*-SPEC.md`, `OBSERVABILITY-RUNBOOK`) | prefix form |
| singletons (`NOTE-`, `INFO-`, `DOD-`, `REFERENCE-`) | nearest canonical, or KB promotion |

**Tail rules:** prefix + lowercase-kebab (`SPEC-color-system.md`). No spaces, no Title-Case tails,
no model-owner suffixes (`-Opus-4.8`), no **priority-ordinal** numeric prefixes (`01-feature.md`),
no status-in-filename (`STALE-*` → status lives in frontmatter). Stable single-writer-minted
**ID numbers** (`TICKET-37-<slug>.md`) are not priority ordinals — permitted. Dates allowed only
in `LOG-`/`RESEARCH-` tails.

### Flat by default; nest only for a large single-topic library

The KB root is **flat**: every durable doc carries a type prefix, so `ls SPEC-*` and glob routing
never lie. Nesting is the **exception**, reserved for a genuinely large single-topic library (rule
of thumb ≥10 docs of one type, e.g. a large runbook library) — and files **keep their prefix inside
the subdir**. Every subdir carries a README trigger table (section d). **One-hop rule:** a KB doc
reached from a router (README, `check --kb`, a skill pointer) must not require chasing a further
doc — agents partial-read second-hop files (`head -100`), so a doc-chain silently truncates. Any KB
doc over ~100 lines carries a table of contents so a partial read still reveals its full scope.

---

## (d) The KB routing contract

The read side is the gap, not the write side (decision 20): fleet evidence shows KB *writes* happen
but nothing routes an agent **to** a doc at the moment of need, so
skills reference the KB only generically ("follow the convention"). This contract closes that.

### Every README index is a trigger table

Every KB README (root + per-subdir) is a table with **one line per doc, phrased as *when to read
it*** — like a skill description, not a bare title list. A list of titles is a defect.

```
| Doc | Read it when… |
|---|---|
| `SPEC-pagination.md` | before changing anything under `src/pdf/` or page-overflow logic |
| `DECISION-vendor-generation.md` | before proposing any change to how vendor files are produced |
```

The trigger table is the KB's routing surface. It is also where the **⚠ drift-marker convention**
lives in the selected convention: a doc with known drift is marked `⚠` in the index with
**commit provenance** and a one-line note:

```
| `SPEC-ui-anatomy.md` | ⚠ MAJOR DRIFT — cites atoms that don't exist (per REVIEW-2026-07-DOCS.md, HEAD f5dd164, 2026-07-01). Verify before trusting. |
```

The index also carries the honest epistemic caveat: *"Docs without a ⚠ were not necessarily
verified."*

### Every KB doc carries frontmatter

```yaml
---
applies-to:
  - "src/pdf/**"
  - "src/features/pagination/**"
last-verified: 2026-07-03
---
```

- **`applies-to:`** — code globs. This is what makes routing mechanical.
- **`last-verified:`** — the date the doc was last checked against the code. Feeds the one
  staleness machinery (decision 35): `agentkit doctor` flags docs whose `applies-to` code churned
  heavily since `last-verified`, and docs never named in a `KB consulted:` line for N weeks.

### Matching is mechanical, never remembered

plan/implement skills gain one standard step: match the files about to be touched against KB
`applies-to` globs and read what matches — **mechanically, via `agentkit check --kb <paths…>`**
(decision 31, already wired in the CLI). The skill does not glob-match in-head; it calls the tool.
This is the same principle as manifest `appliesTo` for skills: everything declares when it's relevant,
so nothing depends on being remembered.

Pair it with the **"read 1–3 KB docs" rule**: *"Read only the 1–3
docs relevant to your task — not none, not all."* That rule is only honest because the trigger tables
make the relevant 1–3 findable instantly.

Rules link back to the KB with `> **Related Knowledge Base:** <path>` — cheap bidirectional drift
detection.

---

## (e) Archive discipline — out of the default search path

Completed work flows to `docs/archive/YYYY-MM/` and then **leaves the search path** (decision 23).
Hundreds of superseded files can pollute every agent grep.

Mechanism — a repo-root **`.ignore`** file (template: `templates/docs-scaffold/dot-ignore`):

- `.ignore` is honored by ripgrep-based search, including Claude Code's Grep tool. It is **NOT
  `.gitignore`** — the archive stays tracked in git; it just stops leaking into agent context.
- Add the codebase-mcp index-exclusion note so the knowledge-graph indexer skips the archive too.
- The archive is still **explicitly searchable on demand** (`rg --no-ignore`, or pointing a tool at
  the path) when history is genuinely wanted.
- `agentkit doctor` verifies each search surface actually honors the exclusion.

Once the archive is out of the search path, the old "prune to 2–3 months" rule becomes optional —
old work keeps its home without costing context.

---

## (f) Research / evidence quarantine

**Raw corpora are evidence, never contracts.** They live outside the KB.

The five-store test (section a) is the gate: a raw research dump, a scraped-marketing corpus, client
coaching notes, or a testimonial bank is none of the five stores. It is source material an agent
reasons *from*, and treating it as truth misleads every future agent. Prior project guidance describes
its research directory as "evidence only — never treat as an implemented contract."

Where evidence goes:
- **Reusable evidence** (a research corpus you may consult again) → `docs/raw-research/` as a **peer
  of the KB**, not inside it. (This is a legitimate use, not a fifth `docs/` store — it sits beside
  `knowledge-base/`, and it is `.ignore`-excluded like the archive.)
- **Dated one-shot dumps** (`Results - 2026-04-12/`) → `docs/archive/YYYY-MM/`.

> **Renamed 2026-07-25: `docs/research/` → `docs/raw-research/`.** The old name collided with
> `docs/knowledge-base/research/` (the verified ledger), and the two have **opposite citation
> rules** under near-identical paths — the exact condition that produces a miscitation. `raw-` puts
> the epistemic status in the path. `docs/research/` remains recognised for existing repos and is
> never store-checked, so nothing breaks; new work uses `raw-research/`.

### The three tiers

Evidence is not one pile. It is three, ordered by ceremony, and each boundary is a **ratchet**:

| Tier | Path | Naming | Guarantees |
| :--- | :--- | :--- | :--- |
| **1. Drop** | `docs/raw-research/inbox/` | **none** — any filename | nothing |
| **2. Curate** | `docs/raw-research/` | `SOURCE-` / `ANALYSIS-` / `PROMPT-` + `YYYY-MM-DD` + kebab topic | provenance |
| **3. Promote** | `docs/knowledge-base/research/` | `RESEARCH-YYYY-MM-DD-<topic>.md` | per-claim ✅/📄/⚠ + a strategy/spec doc it feeds |

**Tier 1 exists because filing must cost nothing.** A capture step with rules is a capture step that
gets skipped, and the source is then lost rather than merely untidy. A full inbox is unprocessed
input, not a failure state. **Nothing may cite the inbox** — an `inbox/` path in any doc, ticket, or
commit message is a defect.

**Only tier 3 may be cited by a contract.** A `docs/raw-research/` path in a `SPEC-`/`STRATEGY-` doc
means either promote it or stop relying on it.

**Tier 2 types** — the one distinction that changes how far you trust a file is *did we write it?*

| Prefix | Holds | Body editable after filing |
| :--- | :--- | :--- |
| `SOURCE-` | Externally authored — hosted research export, collaborator notes, vendor doc copy | **No.** Provenance header only. |
| `ANALYSIS-` | Our own synthesis, not yet verified or promoted | Yes |
| `PROMPT-` | A research request, dispatched or not | Until dispatched |

Each carries a provenance header under the H1: `Type`, `Produced`, `Status`, `Origin`,
`Original filename(s)`, `Superseded by` where it applies — and the **pairing fields**: a `PROMPT-`
carries `Answered by:` (link to the `SOURCE-` its dispatch produced) and that `SOURCE-` carries
`Answers:` (link back). The pairing is what makes the store navigable; without it, prompts and
results drift apart. `Original filename(s)` is a **list** when needed — deduplication legitimately
collapses several drops into one curated file, and every prior name is recorded. The date is when
the artifact was **produced**, not filed; if unknown, use the filing date and say so. Never invent
a date to make a filename tidy.

`Status` is closed — put the nuance in the value, not in prose:
`Current` · `Superseded in part` · `Superseded` · `Unrun` (never dispatched) ·
`Returned-empty` (dispatched and ran; produced no usable output — terminal for that run;
re-dispatch is a new `PROMPT-`) · `Unpromotable` (see below) · `Archived`.

**Sources that can never be promoted get a terminal status, not a backlog slot.** Hosted
deep-research exports commonly carry opaque citation markers (`citeturn…`-style tokens) instead of
URLs. Resolve citations **at export time, before the file is dropped** — that is the cheap moment;
afterwards the links are gone. A `SOURCE-` whose citations arrive unresolvable is stamped
`Status: Unpromotable`: it remains usable tier-2 context, but it is structurally barred from
carrying a promotion (its own citations cannot be traced), and it must stop appearing as pending
work. Individual claims from it may still reach tier 3 — only via independently found primary
sources, never by leaning on the opaque markers.

**The `.ignore` exclusion has a silent failure mode — treat `--no-ignore` as a correctness
requirement, not a convenience.** An excluded tree returns "no matches" from default ripgrep,
which is **byte-identical** to "searched, nothing there." Any *verification* sweep — cross-reference
checks, coverage claims, "nothing links here" assertions — MUST run `rg --no-ignore` over `docs/`
or its conclusion is unsound: it reports consistency for a tree it never read. (The CLI's own
checks walk the filesystem directly and are unaffected; the hazard is agent-run greps.) Record the
blind spot in `project-invariants.md`'s Tool-blind-spots table, where the template already models
exactly this row.

**Renaming evidence is not tidying it.** The older rule — *keep the original name, the value of an
evidence corpus is that it was not tidied after the fact* — is right about **content** and wrong
about **filenames**. A filename is a pointer; `Original filename:` preserves it losslessly. The
immutability that matters is the `SOURCE-` body, and that is absolute.

**Multi-source topics get a folder.** When a topic gains a *second* source, give it
`docs/raw-research/<topic>/` with a `README.md` saying what each source claims **differently** —
two models answering one prompt, where the disagreement is the finding. Flat by default; never a
folder for a single file.

**The linter does not check tier 2, deliberately.** `taxonomyLint` never walks the evidence store.
Enforcing these prefixes would fire on every pre-existing corpus in the fleet and would have to
special-case `inbox/` to avoid destroying what makes tier 1 work — a guard that cries wolf is worse
than none (K10). The **`research-curate` skill** is the enforcement.

**Distill before you quarantine.** Before bulk-archiving a research dir, check for synthesized
`CURRENT`/spec files hiding in the pile — they are durable contracts, not dumps, and blanket
quarantine deletes the only usable knowledge there. A prior corpus provided the proof case: several
`A2-*-CURRENT.md` files were synthesized IA contracts, not model transcripts, and had to be
**promoted to `SPEC-` docs first**, with the raw pairs quarantined afterward. Add
this check to the quarantine step of any remediation.

---

## (g) Sanctioned layout outliers (monorepo)

A monorepo that legitimately cannot fit the app-repo docs shape may be declared a sanctioned
layout outlier (a decision from the program plan records it). The deviations permitted, mapped
generically:

- `.agent` home under a sub-package (e.g. `crm/`), not repo root — a monorepo with multiple
  future domains where only one package currently has an agent system.
- Vendor surfaces (`.claude/.codex/.gemini`) at **monorepo root**, not the package dir — one
  editor opens the monorepo.
- **No `docs/backlog/`** — replaced by design with `backlog-status.md`, an ephemeral view derived
  from distributed `TICKET-*` files (a zero-merge-conflict pattern).
- **KB nests** `overview/runbooks/specs` subdirs instead of flat `SPEC-`/`RUNBOOK-` prefixes — a
  large single-topic runbook library is legitimately richer than flat prefixes support.
- Materialized copies, not junctions — the vendoring strategy is sanctioned for the cloud-synced
  environment.

Everything else in this standard (the CHANGELOG dialect, the harvest-then-roll rule, the trigger-table
contract, `applies-to`/`last-verified` frontmatter, the `.ignore` exclusion) **still applies** to a
sanctioned outlier. The outlier status covers layout only, not hygiene. Layout drift (broken
package `AGENTS.md` chain, missing `git-protocol.md`, no `archive/`) is remediated in a bespoke
Phase-E plan, not waived.

---

## (h) The kit itself — a sanctioned tool-outlier

`agentkit/` is the tool, not an app, and is a documented outlier the way a sanctioned monorepo is (section g) —
different reason, same principle: hold it to the standard's **hygiene**, waive only its **layout**.

- **`governance/` is the kit's KB-equivalent.** The kit's durable truth (this standard, the
  contracts `mirror-contract.md` / `overlay-contract.md` / `canonical-manifest.md`, and its
  `DECISION-*.md` records) lives in `governance/`, not a `docs/knowledge-base/`. Its `docs/` holds
  only lifecycle + evidence (`working/ backlog/ archive/ raw-research/`).
- **Product-surface waiver.** `governance/`, `integrations/`, and `templates/` are product surfaces
  cited fleet-wide by generated rules and load-bearing in the CLI (`KIT_RELATIVE_ROOTS`). Their
  existing bare-kebab filenames are **waived** from the flat-prefix rule — renaming them would
  break inbound citations across every project for cosmetic gain. New `DECISION-` docs added to
  `governance/` **do** use the prefix (the waiver permits bare names, it does not forbid prefixes).
- **Generated-artifact exemption.** Files a tool writes — `reports/inventory.{md,json}`,
  `reports/doctor-last-run.json` — are prefix-exempt and carry a "generated — do not edit" note.
  `reports/` is retained **solely** as the CLI's output directory; it is no longer a docs store.
- **Waiver mechanism (for the taxonomy lint).** A specific warning is suppressed by a one-line
  waiver — in-file frontmatter `taxonomy-waiver: <reason>` or a `governance/` allowlist entry (exact
  path, or a glob when the entry contains `*`, e.g. `docs/kb-fixture/**`). The per-project
  `taxonomyEnforce` ratchet flips from warn to error once every remaining warning is either fixed or
  explicitly waived, **or** once the project records a `taxonomyBaseline` (number): the ratchet then
  gates on regression — `findings > baseline` fails, `findings <= baseline` passes — and the baseline
  only ever decreases, so a legitimate outlier never blocks the ratchet.

## (i) The content-freshness scrub — naming is not the same as being current

Prefixing, indexing, and quarantine (sections a–f) fix *structure*. They do **not** make a doc
*true*. A separate content scrub runs whenever a project's docs are reconciled or after any large
migration — it is the difference between "the KB is well-filed" and "the KB is up to date." Proven
during a prior project reconciliation; every item below caught a real defect there.

### The lenient-pass move trap (the one automation misses)
`agentkit check --content` **lenient-passes** a citation whose *parent directory* still exists (the
target might be a legitimate example path). So a file **moved to a different directory with its
basename unchanged** — e.g. `docs/archive/2026-05/Old-homepage.md` → `docs/raw-research/webflow-legacy/Old-homepage.md`
— leaves every citation of the **old** path silently broken, and the resolve-check says "all clear."

- **Rule:** after any move/rename, grep the **old path** explicitly (`rg 'archive/2026-05/Old-' docs .agent`),
  don't trust `check --content` to catch a dir-only move.
- **Rule:** when rewriting citations for a move, rewrite the **full path**, not just the basename. A
  basename find-replace is a no-op for a move that keeps the basename but changes the directory —
  the exact hole that produced the broken links above.

### Freshness, not just presence, of `applies-to` / `last-verified`
Section (d) requires the two keys exist. The scrub checks they are *true*:
- **`applies-to` must resolve.** Every glob must match real code. A glob that matches nothing
  (`lib/flags/**`, `components/**/sheet/**` when the primitives live in `src/ui/lib/` and no "sheet"
  exists) is drift — fix the glob or the doc. Verify mechanically: does `git ls-files` hit the glob?
- **`last-verified` is a claim you must earn.** To bump it you must actually re-check the doc against
  current code — at minimum: its `applies-to` surfaces exist **and** the body is free of drift tokens
  (prior repo/product names, retired path aliases, monorepo `@scope/` imports, deleted files/symbols,
  removed feature flags). Bumping a date you did not verify is a *false freshness claim* — worse than
  leaving it stale. A doc that fails the check gets a `⚠` marker (section d), not a new date.

### Dead-reference sweep (across live docs, not just the KB)
Grep every live doc for the project's **known-removed** tokens: prior repo/domain names, retired path
aliases, deleted registries/scripts, removed feature flags, and any compatibility-shim file that was
since deleted. These resolve-pass or hide in prose; only a targeted grep finds them.

### Superseded ≠ deleted
A doc whose subject was replaced (pre-migration voice guide, pre-tooling wiring) is kept for
provenance, **banner-marked in two places**: an in-file `> ⚠ SUPERSEDED (date) — <what replaced it>`
banner at the top, **and** a `⚠` note in its README trigger-table row. Leave its `last-verified` as the
historical date; do not bump it. Deleting it loses the "why we don't do it this way" record.

### Multi-doc topics: disambiguate, don't force-merge
Several docs covering one area (e.g. five motion/GSAP docs) is **not** automatically duplication. If
the README trigger table gives each a distinct *"read it when…"* purpose, that is the standard-compliant
way to carry a topic library — the trigger table is the disambiguation surface (section d). Only merge
when two docs genuinely answer the *same* question.

### Index completeness
Every `docs/backlog/*` file appears in the backlog README; every `docs/working/*` in the working
README. A file that exists but is unlisted is invisible to the next agent — a routing hole the taxonomy
lint does not cover.

### Volatile facts do not belong in durable docs
Three classes of fact are **stale-by-construction** — they are wrong the moment anything moves, and
correcting one buys days. Prefixing and indexing do not help; only not writing them does.

- **Line numbers.** Cite a symbol, a heading, or a section — never `file.ts:164`. A line number may
  ride along as a secondary hint, never as the primary anchor. (Live evidence: a spec's line
  citations were off by ~160 lines.)
- **Hand-maintained counts and ratios.** "12 of 28 files", "~500 entries", "exactly 79 characters" —
  **delete on sight**, do not correct. Each of those three was wrong when checked (~29/61, 344, 77).
  If a count matters, generate it; if it cannot be generated, it is not a fact a durable doc should
  assert.
- **Hand-copied command and job expansions.** A script chain or CI job appears **by name only**
  (`npm run validate`, the `pdf-parity` job) — never with a prose expansion of what it runs. The
  expansion drifts from the real definition silently, and a *fictional* job name reads exactly like
  a real one. Both are mechanically checkable; the prose expansion is not.

### Bulk sweeps enumerate from the filesystem, never from an index
Any status, consistency, or coverage pass builds its list by **globbing the directory**. The index is
the claim under test, not the enumerator. (Live evidence: a bulk status sweep took its denominator
from an index — "all 19" — and missed the one ticket that had never been indexed. That ticket still
read `ready` after it had merged.) The same rule governs verification greps: use `rg --no-ignore`
over `docs/`, or the sweep silently skips the `.ignore`-excluded trees and reports consistency for
files it never read.

### Sweep by ownership, not by recency
Drift concentrates where **no program owns the docs**. In a full-tree review, 100% of runbooks and
every doc ported in from another repo needed correction, while actively-worked specs were
half-maintained — the surfaces nobody was assigned to were the ones nobody had fixed. A cadenced
scrub therefore partitions by directory and takes the un-owned surfaces first: ported files,
runbooks, strategy docs, anything with no live ticket pointing at it.

**The scrub's trigger is the session lifecycle, not a calendar.** It runs inside the existing wrap-up
and land steps — a hygiene pass with its own schedule is a schedule nobody keeps, while a pass
attached to a step already in the operator's habit actually runs.

## (j) Status-of-record contract

**Status-of-record lives in exactly one place**: the ticket header **or** the backlog README index
row. The other is derived or dropped — never duplicated. This eliminates the root cause of "status
drifts from git reality."

### An index row points; it never restates

A row is a **link plus a one-line scope** — what the artifact covers and when to read it. It must not
repeat `Status`, `Priority`, `Agent Tier`, `Parallel-safe-with`, or any other field the artifact's own
header owns. A restated field is a second copy that goes stale the instant the first one changes, and
a reader has no way to tell which copy is current.

```
Wrong:  | TICKET-23-partition-import-dag-staff.md | P2 · staff — partition must-precede edges |
Right:  | TICKET-23-partition-import-dag-staff.md | partition emits must-precede edges for
                                                    declared-new-symbol producers |
```

The wrong form copies `**Priority**` and `**Agent Tier**` out of the ticket header. Re-prioritising
now requires editing two files, and only one of them will be edited.

**A narrative header that summarises program state must name its source file and its as-of date.**
Summary prose is not banned — banning it pushes the same sentences somewhere worse — but unsourced,
undated prose is drift in a confident voice. Live evidence: a working README's header restated wave
state and was wrong the same day, while the board it should have pointed at was correct the whole
time. *The index that restates drifts; the index that points does not.*

- **README = forward index** — tells an agent what exists and what's next.
- **CHANGELOG/archive = historical record** — tells an agent what happened.
- **Truth ranking when sources disagree**: code > status board > CHANGELOG narrative. A changelog
  entry is a **point-in-time record** that a later entry supersedes; briefing an agent from the
  changelog head carries whatever was true then into work happening now.
- **ID number ≠ priority ordinal.** A stable single-writer-minted ID number in the filename
  (`TICKET-37-<slug>.md`) is an identity, like a GitHub issue number — minted once, never reused.
  Priority/sequence is *separate derived metadata* (index column + ticket field); re-prioritizing is
  a metadata edit, never a rename.
- **What IS forbidden** is a *priority-ordinal* prefix (`01-feature.md`) or a *parallel-minted*
  number (multiple workers grabbing IDs concurrently). An ID number is neither.

## What we deliberately did NOT do

- Did **not** add a fifth `docs/` store. `docs/raw-research/` is a peer for quarantined evidence, not
  a new state in the lifecycle. ⚠ **Amended 2026-07-25:** "evidence has no lifecycle, it's inert" was
  wrong, and §(f)'s three tiers replace it. Evidence has exactly one lifecycle — *drop → curate →
  promote* — and denying it is what produced corpora with no naming convention, no provenance, and no
  route into the KB. It is still not a **work** lifecycle: no ticket, no status board, no assignee.
- Did **not** invent a new CHANGELOG dialect or "improve" the selected exemplar — the whole point was
  to stop having four dialects. The `KB consulted:` line is the only addition, and it is telemetry,
  not ceremony.
- Did **not** mandate deleting the archive. `.ignore` removes it from the *search path*, not from git;
  the prune rule stays optional (decision 23). Truth deletion is the failure mode we are fixing, not
  adopting.
- Did **not** force a consuming project's monorepo/backlog/nested-KB layout into the standard shape — only its
  hygiene is held to the standard (section g).
- Did **not** remediate any fleet project here — this doc is the standard; the per-project executor
  checklists are `reports/docs-remediation-<project>.md`, run by Phase E.
- Did **not** make KB matching a "remember to check the KB" instruction — it is mechanical via
  `agentkit check --kb`; a human-memory routing step would rot exactly like the write-side didn't.
