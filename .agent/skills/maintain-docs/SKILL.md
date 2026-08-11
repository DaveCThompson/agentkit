---
name: maintain-docs
description: Perform documentation cleanup — archive superseded working docs, consolidate notes, keep the four-directory model intact. Use when docs/working needs the actual tidying done.
tier: core
conflicts-with: [audit-hygiene-enforcement]
---

# Maintain Docs

Systematic documentation cleanup, archival, and consolidation to prevent documentation rot.

## Role: APPLIER — and you re-verify before you touch anything

This skill is the **second half** of the docs-truth pass. `audit-docs` is the read-only reviewer and
hands over a findings file in its schema (quote → correction → evidence → verdict). You hold the
write capability, which is exactly why you do not trust the findings.

**Verify at apply — this is the load-bearing step, not a formality:**

1. **Re-confirm the `quote` exists** in the file, character for character. A quote you cannot find
   means the file changed under the reviewer, or the reviewer paraphrased. Either way: do not apply.
2. **Re-confirm the `evidence`** — open the cited symbol, run the cited command, check the SHA is a
   real ancestor. A finding whose evidence does not hold is refused, not softened.
3. **A path the reviewer says was deleted may never have existed.** Check history
   (`git log --all --pretty=format: --name-only | sort -u | grep <name>`) before writing "removed in
   …". This exact error has happened: a review assumed a deletion for a file that was never there.
4. **You are empowered to deviate, with evidence.** If the doc is right and the finding is wrong,
   the doc wins. Say so.
5. **Report every deviation.** A refused finding is a result, not a gap — it tells the next pass the
   reviewer's model was wrong. Silently dropping it loses that signal.

In the live run this pattern comes from, these steps caught **three wrong findings in the review
layer**. A one-pass "review and fix" agent would have written all three into the docs as corrections.

## When to Use

- After a major feature or implementation slice
- When `docs/working/` contains superseded material mixed with active docs
- As the applier half of a docs-truth pass, on the findings `audit-docs` produced
- Triggered by the session lifecycle — `wrap-up` and `land` — not by a calendar

## Artifacts

- `docs/archive/2026-MM/` — archived working documents (grouped by month)
- `docs/archive/2026-MM/LOG-maintenance-report.md` — summary of actions taken after cleanup

## Approach

Follow the four-directory model (canonical: `governance/docs-standard.md`).

### Phase 1: Discovery

Scan:

1. `docs/working/` — active tickets
2. `docs/backlog/` — future work items
3. `CHANGELOG.md`

### Phase 2: Categorization

For each working doc, classify it as:

- **Keep Active** — still being worked on → stays in `docs/working/`
- **Archive Candidate** — completed → move to `docs/archive/2026-MM/`
- **Backlog Candidate** — not yet started → move to `docs/backlog/`
- **Knowledge-base Promotion** — established a new standard → update `docs/knowledge-base/`
- **Needs Manual Review**

### Phase 3: Archival — inbound-reference sweep BEFORE every move

Moving a file breaks every reference to it, silently. Do the sweep first, then the move:

1. **Grep the filename across the live surfaces** — `docs/knowledge-base/`, `docs/working/`,
   `docs/backlog/`, `.agent/rules/` and the mirrored vendor rule dirs. Match **both** markdown links
   `](…name.md)` and backticked or bare mentions; an index row is usually the latter, which is
   precisely why it survives a link-only check.
2. **Use `rg --no-ignore`.** `docs/archive/` and `docs/raw-research/` are `.ignore`-excluded, so a
   default ripgrep returns "no matches" for a tree it never opened — byte-identical to a real clean
   result (`governance/docs-standard.md` §(f)).
3. **Retarget every hit** to the new path, then move with `git mv` so history survives.
4. **Rewrite the FULL path, not the basename.** A move that keeps the filename but changes the
   directory is a no-op for a basename find-replace — and it leaves every old citation broken while
   a resolve-check reports all clear (the lenient-pass move trap, §(i)).
5. Move not-yet-started items to `docs/backlog/`.
6. Do not archive docs that still define current truth.

### Phase 3b: Close the pass with the checker

**A maintenance pass that ends without running the checker is an unverified claim.** Run
`agentkit check --content` and `agentkit check --taxonomy` and read the true exit codes. `--taxonomy`
covers both index directions — a README naming a doc that is gone, and a doc that no index names.
Fix what they surface, or record explicitly why an entry stands.

### Phase 4: Ticket Hygiene

- Review `docs/working/README.md`
- Archive or close tickets only when the work is actually complete and no longer belongs in the active queue
- Prune stale backlog items in `docs/backlog/`

### Phase 5: Report Generation

Create `docs/archive/2026-MM/LOG-maintenance-report.md` summarizing:

- files archived (with month directory)
- files moved to backlog
- files promoted to knowledge-base
- files kept active
- files needing manual review
- **findings applied, and findings REFUSED with the evidence that refuted them** (a refused finding
  is a result — it tells the next pass where the reviewer's model was wrong)
- the checker's exit codes from Phase 3b, as run

## Constraints

- Never delete without explicit approval
- Preserve metadata blocks and links
- Ask before archiving files that still appear active
- Keep the four-directory model intact:
  - `docs/knowledge-base/` for durable truth (nesting allowed)
  - `docs/working/` for active work (flat, no nesting)
  - `docs/backlog/` for future work (flat, no nesting)
  - `docs/archive/` for completed work (grouped by month, flat within)
