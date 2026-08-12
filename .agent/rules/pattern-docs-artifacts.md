---
trigger: model-decision
description: Consult before creating or moving tickets, plans, reviews, logs, or changelog entries — the four-directory docs model (working/backlog/archive/knowledge-base), status-of-record contract, changelog rolling window.
domain: docs
---

# Artifacts Rule

Use the repository's four-directory docs model (canonical spec: `governance/docs-standard.md`).

**This rule is the canon; do not hand-write a second copy of it.** A project-local
"docs-structure convention" doc restating this model is drift by construction — it is a hand-maintained
duplicate of a synced file, and the two disagree the first time either changes. If a project needs a
convention doc, it points here rather than paraphrasing.

## Core Artifacts

### Work Items
- Active tickets and plans: `docs/working/TICKET-{name}.md` (flat, no nesting)
- Future/unstarted items: `docs/backlog/TICKET-{name}.md` (flat, no nesting)

### Reports
- Store audits, findings, and vet reports in `docs/working/REVIEW-{name}.md`

### Logs
- Store implementation history and session summaries in `docs/archive/2026-MM/LOG-{name}.md` once they are no longer actively needed
- Use `docs/working/LOG-{name}.md` only as a short-lived temporary handoff artifact, then archive it promptly

### Evidence (research corpora)
Evidence is a **peer** of the four stores, never inside the KB, and it moves through three tiers —
canonical spec: `governance/docs-standard.md` §(f). Run the `research-curate` skill to walk it.

- `docs/raw-research/inbox/` — drop zone. **No naming convention, no header, no index row.** Filing <!-- taxonomy-ignore-line -->
  must cost nothing or sources stop being captured. **Nothing may cite the inbox** — an `inbox/`
  path in a doc, ticket, or commit message is a defect.
- `docs/raw-research/` — curated: `SOURCE-` (externally authored, body immutable) / `ANALYSIS-` (our
  synthesis) / `PROMPT-` (a research request), each `+YYYY-MM-DD-<kebab-topic>.md` with a provenance
  header. A topic gets its own folder once it has a **second** source.
- `docs/knowledge-base/research/RESEARCH-YYYY-MM-DD-<topic>.md` — promoted: per-claim ✅/📄/⚠ markers
  and a strategy/spec doc it feeds. **Only this tier may be cited by a contract.**

Promotion is rewriting with verification, not moving a file. Never carry a ✅ across a tier boundary
without re-running the check. (`docs/research/` is the legacy name for `raw-research/`, still <!-- taxonomy-ignore-line -->
recognised.)

### Changelog
- Use `CHANGELOG.md` for release-history style summaries
- Add new entries without removing prior history
- Prepend the newest entry below the file intro; do not rewrite the rest of the file
- Prepend also makes concurrent sessions race-tolerant — two prepends conflict trivially and merge cleanly, unlike appends at a shared tail
- Never use placeholders like `...` inside the live changelog
- Treat `CHANGELOG.md` as a rolling window, not a permanent ledger
- Keep roughly the last 7 days of entries or about 250 lines in the live file, whichever is shorter
- Archive older entries into dated files under `docs/archive/2026-MM/` and leave a pointer to the archive chain in the live changelog

## Status-of-Record Contract

- **Status-of-record lives in exactly one place**: the ticket header **or** the backlog README index row. The other is derived or dropped — never duplicate.
- **An index row points; it never restates.** A row is a link plus a one-line **scope** — *what the artifact covers and when to read it*. It must not repeat `Status`, `Priority`, `Agent Tier`, `Parallel-safe-with`, or any other field the artifact's own header owns. A restated field is a second copy that goes stale the moment the first one changes, and a reader cannot tell which copy is current.
- **A narrative header that summarises state must name its source and its date.** Prose like "Next up: …" is permitted only when it names the file that actually owns the truth and the date it was checked. Unsourced, undated summary prose is drift with a confident voice.
- **Volatile facts do not belong in durable docs.** Cite symbols and sections, never bare line numbers — line numbers rot under any edit. Delete hand-maintained counts and ratios ("12 of 28 files", "~500 entries") on sight rather than correcting them; they are stale-by-construction and correcting one buys days. Script chains and CI job names appear **by name only** — never with a hand-copied expansion of what they run.
- **Bulk sweeps enumerate from the filesystem, never from an index.** Any status, consistency, or coverage pass globs the directory to build its list. The index is the claim under test — using it as the enumerator means an unindexed file is invisible to the very sweep meant to catch it.
- **README = forward index** (tells you what exists and what's next); **CHANGELOG/archive = historical record** (tells you what happened).
- **ID number ≠ priority ordinal.** Filenames carry a single-writer-minted stable ID number (`TICKET-37-<slug>.md`) — an identity like a GitHub issue number, minted once, never reused. Priority/sequence is *separate derived metadata* — an index column + a ticket field. Re-prioritizing = a metadata edit, never a rename.
- **What IS forbidden** is a *priority-ordinal* number in the filename (e.g. `01-feature.md` — numeric ordering prefix) or a *parallel-minted* number (multiple workers grabbing IDs concurrently). A single-writer-minted stable ID is not either of those.
- **Junior-pack sections inside backlog tickets are sanctioned.** A single `TICKET-` file may contain `## Plan` / `## Changes` / `## Acceptance` sections — no forced `TICKET`+`PLAN` split. The `TICKET-` prefix covers both the ticket and its embedded execution plan.

## Best Practices
- Keep artifacts concise and honest
- Do not create duplicate summaries in multiple locations
- Prefer `docs/working/` over legacy generic paths such as `brain/` or `walkthrough.md`
- Archive completed work to `docs/archive/2026-MM/` (grouped by month, flat within)
- Move not-yet-started items from `docs/working/` to `docs/backlog/`
- Prefer archiving completed logs rather than letting them accumulate in `docs/working/`

## Cross-References
- See `pattern-navigation.md` for the hard archive contract when retiring runtime features but keeping client-locked placeholders.
