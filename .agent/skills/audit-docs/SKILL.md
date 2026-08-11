---
name: audit-docs
description: Documentation drift detection and knowledge-base hygiene. Use after major changes or for periodic maintenance.
tier: core
---

# Audit Docs Skill

Logic for ensuring documentation integrity and preventing "Documentation Rot".

## Role: REVIEWER — read-only, always

This skill is the **first half** of a two-agent pass. It reads and writes a findings file. It does
**not** edit a single doc — `maintain-docs` is the applier, and it re-verifies every finding before
touching anything.

**Why the split is not ceremony.** A reviewer is confidently wrong often enough to matter. In the
live run this pattern comes from, verify-at-apply caught **three errors inside the review layer
itself**: a false claim about where snapshot JSON exists, a cited path that had **never existed**
(the reviewer assumed a deletion), and a "shipped" mark with no evidence behind it. A single agent
doing both halves would have written all three into the docs as authoritative corrections. If you
find yourself about to fix something you just found, stop — that is the failure mode.

## The finding schema (the handoff artifact)

Every lens emits findings in this shape. It is what makes the output *appliable* rather than merely
readable, and `maintain-docs` re-checks each field before acting:

```
- file:        <path>
  quote:       "<the EXACT current text, copied — not paraphrased>"
  correction:  <what it should say>
  evidence:    <symbol, section, command output, or SHA that proves it — never a bare line number>
  verdict:     drift | stale | contradiction | dead-reference | uncertain
```

`uncertain` is a first-class verdict, not a failure. A finding you cannot evidence is still worth
reporting — it just must not be dressed as a fact. Anchor `evidence` to symbols and sections;
`governance/docs-standard.md` §(i) bars bare line numbers from durable docs for the same reason they
are useless here: they rot under any edit.

## Instructions

1. **Verify Spec Isolation**:
   - Check `docs/specs`.
   - **MUST BE ABSENT OR EMPTY**. Durable specs belong in `docs/knowledge-base/specs/`. If files
     exist in `docs/specs`, classify and move them into the four-directory model.
   - Also check for loose `SPEC-*` files outside `docs/knowledge-base/specs/` (e.g., in `docs/working/`).
     These should be moved to `docs/knowledge-base/specs/` or archived.

2. **Verify Rule Coverage**:
   - Trace recent `./CHANGELOG.md` entries or feature implementation plans.
   - Check if new patterns (UI components, state management, API design) are documented in `.agent/rules/*.md`.
   - Identify "Rule Drift" — where code behavior deviates from documented standards.

3. **Link Integrity — delegate to the CLI; do not hand-roll it**:
   - Run `agentkit check --content`. It owns markdown links, backticked and bare repo paths,
     `npm run` script names, CI job names, `.agent` asset references, and `:line` citations, and it
     resolves each against the citing file's directory, then the repo root, then the kit.
   - Run `agentkit check --taxonomy`. It owns **both** index directions: a README naming a doc that
     no longer exists (renamed away), and a doc that exists but is named in no index.
   - Residual prose-only work — the genuinely unmechanized part, and the only link checking you do
     by hand: **external URLs** (is `https://…` still live?) and **in-page anchors** (`#section`
     targets within a document).
   - Do not re-run `rg` over what the CLI just resolved. A hand-rolled sweep that disagrees with the
     checker is a second source of truth, and it will be the wrong one.

4. **Backlog Index Integrity** (only if the project keeps a `docs/backlog/` directory — repos using
   the ephemeral `backlog-status` view have no backlog dir; skip this check for them):
   - `agentkit check --taxonomy` already enforces this mechanically in both directions
     (`unindexed-doc` and the dead-index lint). Read its output rather than re-deriving the list.
   - **Enumerate from the filesystem if you verify by hand.** Glob the directory; the index is the
     claim under test, never the enumerator. A bulk pass that took its denominator from an index
     missed the one ticket that had never been indexed — which is the whole reason this lens exists.

5. **Archival Integrity**:
   - Verify that PRDs marked as "Implemented" in the changelog have been moved to `docs/archive/`.

6. **Status-Drift Check**:
   - Plans and status docs carry point-in-time state that rots (a cover plan claimed "Phase 1
     complete on branch X (uncommitted)" long after that branch was merged and deleted).
   - Flag any doc that asserts a branch exists when `git rev-parse --verify <branch>` fails, or
     that claims an "uncommitted / on branch X / not yet merged" state for a branch already
     merged or gone. Pair with the §i content-freshness scrub in `docs-standard.md`.

7. **Self-contradiction Check**:
   - Flag any doc whose header/Status line contradicts its own body (e.g., header says "in
     progress" while the body describes shipped work; a "DESIGN — unresolved questions" status
     over a body whose questions are all answered).
   - Distinct from step 6, which checks a doc's claims against git reality; step 7 checks the doc
     against itself and needs no git.

## Constraints
- **Read-only. This skill edits nothing.** Hand the findings file to `maintain-docs`.
- Use `rg --files` or `Get-ChildItem -Recurse` for isolation checks.
- Link/path/index validation is the CLI's (step 3) — hand `rg` sweeps only for external URLs and
  in-page anchors.
- Any grep over `docs/` uses `--no-ignore`: `docs/archive/` and `docs/raw-research/` are
  `.ignore`-excluded, and an excluded tree's "no matches" is byte-identical to "searched, nothing
  there" (`governance/docs-standard.md` §(f)).
- **NEVER** delete files without user confirmation; move to `docs/archive/` instead.
- Raw command output goes to `docs/working/evidence/` (gitignored); findings docs cite the evidence file by name.

## Output
Every lens ends in findings or an explicit clean attestation — name what was checked and state it came back clean; a lens with neither is an under-delivered audit, not a pass.
Findings use the schema above (quote → correction → evidence → verdict) so `maintain-docs` can apply
them directly. Findings report highlighting:
- [ ] Stray specs found
- [ ] Missing rule coverage
- [ ] Broken documentation links (including stale README trigger-table entries)
- [ ] Orphaned active PRDs
- [ ] Status drift (dead branches, "uncommitted" claims for merged/deleted branches)
- [ ] Self-contradiction (header/Status line disagrees with the body it heads)
