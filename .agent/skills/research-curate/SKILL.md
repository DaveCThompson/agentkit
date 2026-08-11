---
name: research-curate
description: Curate the evidence corpus — take raw drops from docs/raw-research/inbox/, name and stamp them into the curated store, group multi-source topics into folders, and promote finished findings into the knowledge-base research ledger. Use when the inbox has accumulated files, when a research pass returns, or when a curated file is ready to become a contract.
tier: core
---

# Research Curate

Walk evidence through the three tiers defined in `governance/docs-standard.md` §(f):

```
raw-research/inbox/   →   raw-research/            →   knowledge-base/research/
  tier 1: no rules        tier 2: named + stamped      tier 3: verified + promoted
```

Each boundary is a **ratchet**: tier 2 guarantees provenance, tier 3 guarantees per-claim
verification. **Never skip a tier** — a file that jumps from inbox to the ledger carries a
verification marker nobody earned, which is worse than no marker at all.

Sibling skills: `research-deep` conducts a pass; `research-synthesize` maps findings onto the
codebase. This one owns the **filing and promotion** between them.

## When to use

- The inbox has files in it.
- A dispatched research prompt came back.
- A tier-2 `ANALYSIS-` is ready to become a strategy or spec position.
- A `Review by:` date on a strategy doc has passed and its evidence needs re-checking.

## Phase 1 — Inventory (read-only)

0. **Every grep in this skill runs `rg --no-ignore`.** The evidence store is `.ignore`-excluded
   from default search, and an excluded tree's "no matches" is byte-identical to "nothing there" —
   a cross-reference sweep without `--no-ignore` reports consistency for a tree it never read.
   This is a correctness requirement, not a convenience (`docs-standard.md` §f).
1. List `docs/raw-research/inbox/`. For each file, read enough to answer three questions:
   - **Who authored it?** Us, a model, a person, a vendor → decides `SOURCE-` vs `ANALYSIS-`.
   - **When was it produced?** From the **content**, not the filesystem and not `git log` — a
     corpus imported in one commit has one git date for every file, which is no date at all.
   - **What topic?** In the repo's existing vocabulary where one fits, not a new synonym.
2. Group by topic. Two or more files on one topic is the **signal for a topic folder**, not a
   defect — it is usually the most valuable material in the corpus.
3. **Scan for secrets first.** Exported chat transcripts carry API keys, tokens, and third-party
   private detail, and `docs/raw-research/` is tracked. A hit stops that file's curation until it
   is redacted or deleted. See `foundation-security.md`.
4. Report the inventory and proposed disposition. **Move nothing yet.**

## Phase 2 — Curate into tier 2

For each approved file:

1. **Rename** to `<TYPE>-<YYYY-MM-DD>-<kebab-topic>.md` with `git mv` (preserves history).

   | TYPE | Means | Body editable after filing |
   | :--- | :--- | :--- |
   | `SOURCE-` | Externally authored — hosted research export, collaborator notes, vendor doc copy | **No** |
   | `ANALYSIS-` | Our own synthesis, not yet verified or promoted | Yes |
   | `PROMPT-` | A research request, dispatched or not | Until dispatched |

2. **Add the provenance header** directly under the H1:

   ```markdown
   **Type:** ANALYSIS · **Produced:** 2026-07-24 · **Status:** Current
   **Origin:** <who or what produced it — model, service, person>
   **Original filename(s):** <the name(s) it arrived with — a list when dedup collapsed several drops>
   **Answers:** <SOURCE- only: link to the PROMPT- that dispatched it, or omit>
   **Answered by:** <PROMPT- only: link to the SOURCE- it produced, or omit until it returns>
   **Superseded by:** <link, or omit>
   ```

   `Status` is closed — put the nuance in the value, never in prose:
   `Current` · `Superseded in part` · `Superseded` · `Unrun` (never dispatched) ·
   `Returned-empty` (dispatched and ran; no usable output — terminal for that run; re-dispatch is
   a new `PROMPT-`) · `Unpromotable` (citations arrived unresolvable — see step 2a) · `Archived`.
   If the produced date is unknown, write `Produced: unknown — filed YYYY-MM-DD`. **Never invent a
   date to make a filename tidy.**

2a. **Check citation resolvability at curation time.** Hosted deep-research exports commonly carry
   opaque citation markers (`citeturn…`-style tokens) instead of URLs — and the cheap moment to
   resolve them is **export time, before the drop**; say so to whoever runs the exports. A
   `SOURCE-` that arrives with unresolvable citations is stamped `Status: Unpromotable`: still
   usable tier-2 context, structurally barred from carrying a promotion, and **no longer pending
   work**. Claims from it may still reach tier 3 — only via independently found primary sources.

3. **A `SOURCE-` body is never edited.** Not for a typo, not to update a stale claim, not to strip
   export artifacts. Add the header; leave the rest. If it is wrong, that belongs in an `ANALYSIS-`
   that corrects it, plus a `Superseded by` line on the source.
4. **Multi-source topic** → `docs/raw-research/<topic>/` with a `README.md` stating what each source
   says **differently**. The disagreement between two passes is the finding; a README that only
   lists filenames has thrown it away. Flat by default — no folder for a single file.
5. Update the Contents table in `docs/raw-research/README.md`.

### Renaming is not tidying evidence

"Keep the original name — the value of an evidence corpus is that it was not tidied after the fact"
is right about **content** and wrong about **filenames**. A filename is a pointer; the
`Original filename:` line preserves it losslessly. The immutability that matters is the `SOURCE-`
body, and that is preserved absolutely.

## Phase 3 — Promote to tier 3

Promotion is **rewriting with verification**, not moving a file. A finding that cannot survive this
phase is not finished — leave it at tier 2 and say why.

1. Write a new `docs/knowledge-base/research/RESEARCH-YYYY-MM-DD-<topic>.md`.
2. Mark **every substantive claim**: ✅ verified in-session (command run or doc fetched, output
   quoted) · 📄 sourced (primary source, URL + fetch date) · ⚠ inference or secondary. An unmarked
   claim is treated as ⚠.
   **Do not inherit a marker across the promotion.** Re-verify or downgrade it. Carrying a ✅ from
   tier 2 without re-running the check is precisely the failure the marker exists to prevent.
3. Give each source a URL **and** the date fetched.
4. **Open the strategy or spec doc the actionable part belongs in.** A finding with nothing promoted
   is either not actionable or not finished — say which. This is the most-skipped step, and skipping
   it turns the ledger into a graveyard.
5. Add the ledger row in `docs/knowledge-base/research/README.md` with its `Promoted into` target.
6. Leave the tier-2 file in place, `Status:` updated. Promotion does not consume the evidence.

## Phase 4 — Clean up

- **Never edit a past finding to make it current.** Write a new dated one; mark the old row
  `Superseded by …`. The ledger's value is showing what was true when a decision was made.
- Set `Superseded` / `Superseded in part` on displaced tier-2 files, with a link forward.
- **Check the repo boundary.** Material belonging to a peer repo does not get curated here — route
  it and delete, with a README line naming where it went. Git holds the content.
- An expired `Review by:` is a research trigger, not a cleanup item. File it as work.

## Invariants

1. **Nothing cites the inbox, ever.** Not a strategy doc, not a spec, not a commit message. An
   `inbox/` path in a citation is a defect.
2. **Only tier 3 may be cited by a contract.** A `docs/raw-research/` path in a strategy or spec doc
   is a defect — promote it or stop relying on it.
3. **Cite-or-run applies to promotion.** Every ✅ means the command was run or the doc fetched *in
   the promoting session*, with output quoted (`foundation-testing.md` §1B).
4. **`SOURCE-` bodies are immutable.** Provenance header only.
5. **A full inbox is not a failure state.** It is unprocessed input. The failure mode is a source
   never captured because filing it felt like work — which is why tier 1 has no rules.

## Why the linter does not check tier 2

`taxonomyLint` never walks the evidence store, by design. Enforcing `SOURCE-`/`ANALYSIS-`/`PROMPT-`
there would fire on every pre-existing corpus in the fleet and would have to special-case `inbox/`
to avoid destroying the thing that makes tier 1 work. A guard that cries wolf is worse than none
(K10). **This skill is the enforcement**; the grammar is a convention it applies, not a gate.
