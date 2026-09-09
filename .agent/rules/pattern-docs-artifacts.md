---
trigger: model-decision
description: Consult before creating or moving tickets, plans, reviews, logs, or changelog entries — the four-directory docs model (working/backlog/archive/knowledge-base), status-of-record contract, changelog rolling window.
domain: docs
---

# Artifacts Rule

Use the repository's four-directory docs model. The canonical spec is `governance/docs-standard.md`
in the selected AgentKit checkout, not necessarily in the consumer project. Locate that checkout from
the existing agentkit launcher/setup or configured vendor hook and read the spec there. Do not assume
the shell's current kit branch matches the consumer's completed lock. If the checkout is unavailable,
use this shipped rule and the project's declared layout, and name any detail that still requires the
spec. Do not copy a governance tree or invent a project path to satisfy the reference.
Resolve its declared KB root (`docs.kbRoot`, default `docs/knowledge-base`) and sanctioned layout.
Flat specs describe current truth; prospective requirements stay in the accepted ticket, PLAN or PRD.
Create separate artifacts only for a distinct reader or responsibility.

**This rule is the canon; do not hand-write a second copy of it.** A project-local
"docs-structure convention" doc restating this model is drift by construction — it is a hand-maintained
duplicate of a synced file, and the two disagree the first time either changes. If a project needs a
convention doc, it points here rather than paraphrasing.

## Core Artifacts

### Work Items
- Active work defaults to `docs/working/TICKET-{name}.md` (flat, no nesting); an existing accepted
  `PLAN-` or plan embedded in a ticket is equally usable. Pass the caller's exact artifact identity
  through planning, readiness, build and resume. Do not require a second file or rename to proceed.
- Future/unstarted items: `docs/backlog/TICKET-{name}.md` (flat, no nesting)

### Reports
- Store audits, findings, and vet reports in `docs/working/REVIEW-{name}.md`

### Logs
- Store implementation history and session summaries in `docs/archive/YYYY-MM/LOG-{name}.md` once they are no longer actively needed
- Use `docs/working/LOG-{name}.md` only as a short-lived temporary handoff artifact, then archive it promptly

### Evidence (research corpora)
Evidence is a **peer** of the four stores, never inside the KB, and it moves through three tiers —
canonical spec: `governance/docs-standard.md` §(f). Run the `research-curate` skill to walk it.

- `docs/raw-research/inbox/` — drop zone. **No naming convention, no header, no index row.** Filing <!-- taxonomy-ignore-line -->
  must cost nothing or sources stop being captured. A forensic record may cite an exact capture
  location and content identity with its uncurated status. Contracts cannot treat it as verified truth.
- `docs/raw-research/` — curated: `SOURCE-` (externally authored, body immutable) / `ANALYSIS-` (our
  synthesis) / `PROMPT-` (a research request), each `+YYYY-MM-DD-<kebab-topic>.md` with a provenance
  header. Keep sources flat unless a topic folder provides navigation the flat layout cannot.
- `docs/knowledge-base/research/RESEARCH-YYYY-MM-DD-<topic>.md` — promoted: per-claim ✅/📄/⚠ markers
  and a strategy/spec doc it feeds. **Only this tier may be cited by a contract.**

Promotion assesses claims. Reassess existing proof under `foundation-testing.md` §1A; cite it when
the proposition, relevant source and environment still match. A filing-only move needs preservation
and link checks, not a repeated runtime check. (`docs/research/` is the legacy name for `raw-research/`, still <!-- taxonomy-ignore-line -->
recognised.)
State what each check establishes. A retrieved source can support attribution without verifying
its factual claim. Promotion records evidence, not approval of a proposed project decision.

### Changelog
- Use `CHANGELOG.md` for release-history style summaries
- Add new entries without removing prior history
- Prepend the newest entry below the file intro; do not rewrite the rest of the file
- The coordinator owns shared changelog edits. Use assigned fragments for parallel contributions;
  prepending does not make concurrent writes safe.
- Finalize one titled entry with actual proof limits and pending combined-gate owner before consuming
  fragments. Retain exact fragment recovery and the intro/archive chain. Assembly is separate from
  harvest and archival; it does not establish integration or publication.
- Never use placeholders like `...` inside the live changelog
- Treat `CHANGELOG.md` as a rolling window, not a permanent ledger
- Keep roughly the last 7 days of entries or about 250 lines in the live file, whichever is shorter
- Archive older entries into dated files under `docs/archive/YYYY-MM/` and leave a pointer to the archive chain in the live changelog

## Status-of-Record Contract

- **Ticket frontmatter owns work status.** Preserve legacy prose-only parsing, but do not maintain
  two independent copies when frontmatter exists. Boards own scheduling and derive ticket status;
  index rows point. Reported work is not necessarily integrated, published or fully verified.
- Update `status` and `updated` where the parser reads them. Record `landed` only after verified
  ancestry in the configured integration/main reference. Publication needs separate target/result
  evidence; a source or dependency SHA is not completion proof.
- Preserve required pending lanes and remaining acceptance in an active work item. Archive only
  after completion or explicit transfer to a discoverable successor. Closing a conversation or
  pausing an attempt does not mark unfinished work complete.
- **An index row points; it never restates.** A row is a link plus a one-line **scope** — *what the artifact covers and when to read it*. It must not repeat `Status`, `Priority`, `Agent Tier`, `Parallel-safe-with`, or any other field the artifact's own header owns. A restated field is a second copy that goes stale the moment the first one changes, and a reader cannot tell which copy is current.
- **A narrative header that summarises state must name its source and its date.** Prose like "Next up: …" is permitted only when it names the file that actually owns the truth and the date it was checked. Unsourced, undated summary prose is drift with a confident voice.
- **Avoid unmaintained current-state claims in durable docs.** Prefer symbols and sections to bare
  line numbers. Reviews may cite exact lines with a source revision; dated measurements and test
  counts are valid historical evidence, not live inventories. Derive changing inventories when
  needed. Name the canonical script/job instead of copying its implementation into another rule.
- **Bulk sweeps enumerate from the filesystem, never from an index.** Any status, consistency, or coverage pass globs the directory to build its list. The index is the claim under test — using it as the enumerator means an unindexed file is invisible to the very sweep meant to catch it.
- **README = forward index** (tells you what exists and what's next); **CHANGELOG/archive = historical record** (tells you what happened).
- For Git-ignored working/backlog records, use an optional Git-ignored `README.local.md` companion
  beside the queue's public README. The public README names it conditionally; do not publish dead
  links to private work. Both indexes retain link and coverage checks. See the canonical docs
  standard's Index completeness section; preserve the original rows before splitting an index.
- **ID number ≠ priority ordinal.** Filenames may carry a single-writer-minted stable ID number
  (`TICKET-37-<slug>.md`), never reused. Priority belongs to the ticket; scheduling views derive
  order. Re-prioritizing changes metadata, not identity or a second manually maintained index field.
- **What IS forbidden** is a *priority-ordinal* number in the filename (e.g. `01-feature.md` — numeric ordering prefix) or a *parallel-minted* number (multiple workers grabbing IDs concurrently). A single-writer-minted stable ID is not either of those.
- **Junior-pack sections inside backlog tickets are sanctioned.** A single `TICKET-` file may contain `## Plan` / `## Changes` / `## Acceptance` sections — no forced `TICKET`+`PLAN` split. The `TICKET-` prefix covers both the ticket and its embedded execution plan.

## Best Practices
- Keep artifacts concise and honest
- Do not create duplicate summaries in multiple locations
- Prefer `docs/working/` over legacy generic paths such as `brain/` or `walkthrough.md`
- Archive completed work to `docs/archive/YYYY-MM/` (grouped by month, flat within)
- Move not-yet-started items from `docs/working/` to `docs/backlog/`
- Prefer archiving completed logs rather than letting them accumulate in `docs/working/`

### Moves, handoffs and preservation

Establish tracking, ownership and useful content before moving or retiring a location. Git only
recovers recorded content; ignored/untracked evidence may need an explicit local copy and hash
comparison. Preserve the project's ignore policy and verify recipient access before retiring a source.
Check both incoming and outgoing relative links and fragments. Keep externally authored source bodies
immutable; use provenance/link-resolution mappings or retain the old location when a move would break
their citations. Search scoped ignored stores explicitly during integrity checks. Do not hand-edit
generated vendor surfaces to retarget links; correct their canonical sources and regenerate.

## Cross-References
- See `pattern-navigation.md` for the hard archive contract when retiring runtime features but keeping client-locked placeholders.
