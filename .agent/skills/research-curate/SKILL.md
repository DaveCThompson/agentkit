---
name: research-curate
description: File research drops with provenance and stable citations, or promote assessed findings into the research ledger. Use when asked to curate evidence, when a report needs a durable local citation, or when evidence is ready for promotion; filing does not accept project decisions.
tier: core
---

# Research Curate

Resolve the project's docs root, sanctioned layout and storage policy before choosing destinations.
Walk evidence through the three tiers defined in `governance/docs-standard.md` §(f), "The three tiers":

```
raw-research/inbox/   →   raw-research/            →   knowledge-base/research/ <!-- taxonomy-ignore-line -->
  tier 1: no rules        tier 2: named + stamped      tier 3: verified + promoted
```

Each transition adds evidence obligations: curation establishes provenance; promotion assesses
claims. Complete those obligations even when both happen in one authorized pass. Folder placement
alone establishes neither truth nor approval of a project commitment.

Sibling skills: `research-deep` conducts a pass; `research-synthesize` maps findings onto the
codebase. This one owns the **filing and promotion** between them.

## When to use

- The user requests inbox filing or a research result needs a stable local citation.
- A dispatched research prompt returned and its provenance needs recording.
- A tier-2 `ANALYSIS-` is ready for evidence promotion or an authorized project decision.
- A `Review by:` date on a strategy doc has passed and its evidence needs re-checking.

## Phase 1 — Inventory (read-only)

0. **Every grep in this skill runs `rg --no-ignore`.** The evidence store is `.ignore`-excluded
   from default search, and an excluded tree's "no matches" is byte-identical to "nothing there" —
   a cross-reference sweep without `--no-ignore` reports consistency for a tree it never read.
   This is a correctness requirement, not a convenience (`docs-standard.md` §f).
1. Enumerate the requested evidence surface from the filesystem, including ignored files. For each
   file, establish:
   - **Who authored it?** Us, a model, a person, a vendor → decides `SOURCE-` vs `ANALYSIS-`.
   - **When was it produced?** From the **content**, not the filesystem and not `git log` — a
     corpus imported in one commit has one git date for every file, which is no date at all.
   - **What topic?** In the repo's existing vocabulary where one fits, not a new synonym.
2. Group by topic without assuming a new directory. Keep small source sets flat and explain
   differing claims in the existing index or analysis. Add a folder only when flat naming cannot
   provide useful navigation.
3. Inspect each source's tracked, untracked or ignored state and existing destination. Never assume
   Git contains its bytes. Identify shared-file owners and a non-colliding destination before moving.
4. Screen for secrets and private third-party details before copying content into a wider audience
   or tool log. Follow `foundation-security.md`; preserve the restricted original while resolving
   safe handling. An authorized redacted derivative needs its own provenance and redaction note;
   it must not silently replace an immutable source.
5. Determine authority from the request. Inventory-only work returns proposed dispositions here.
   A curation request can already authorize filing; do not require repeated approval for those
   moves. Contract edits, peer-repo transfers and deletion need authority for their actual targets.

## Phase 2 — Curate into tier 2

For each file covered by the existing filing request:

1. **Prepare a recoverable move** to `<TYPE>-<YYYY-MM-DD>-<kebab-topic>.md`:
   - Resolve exact source/destination paths and collisions. Record the old-to-new path mapping and
     a content fingerprint. Establish a preserved copy of the exact content before removing the
     source location; an uncommitted file is not recoverable merely because its path is tracked.
   - Resolve outgoing relative links, reference-style links and prompt/source pairing targets
     against the original location, including fragments. Record already-broken targets separately.
   - Use a storage-appropriate operation. A Git owner may use `git mv` for tracked files; local-only
     evidence uses a filesystem operation without staging. Shared-tree authors never run Git
     mutations; coordinate moves involving shared indexes under `pattern-agent-orchestration.md`.
   - Verify destination content before source removal. Do not overwrite a collision, force-add
     ignored evidence, change ignore policy or publish it to make the move work. If recovery or
     citation preservation cannot be established, retain the source and report the exact gap.

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

   Use the status vocabulary in `governance/docs-standard.md` §(f); explanations can accompany it:
   `Current` · `Superseded in part` · `Superseded` · `Unrun` (never dispatched) ·
   `Returned-empty` (dispatched and ran; no usable output — terminal for that run; re-dispatch is
   a new `PROMPT-`) · `Unpromotable` (citations arrived unresolvable — see step 2a) · `Archived`.
   If the produced date is unknown, use the filing date in the filename and write
   `Produced: unknown — filed YYYY-MM-DD`. Never label the filing date as a production date.

2a. **Check citation resolvability at curation time.** An export may carry opaque citation markers
   (`citeturn…`-style tokens) instead of URLs. Preserve URL mappings at export time where available;
   never fabricate them afterward. A `SOURCE-` that arrives with unresolvable citations is stamped
   `Status: Unpromotable`: still usable tier-2 context, structurally barred from carrying a promotion.
   That source's filing is complete; any required unanswered research remains in the active work
   item. Claims from it may still reach tier 3 via independently found primary sources.

3. **A `SOURCE-` body is never edited.** Not for a typo, not to update a stale claim, not to strip
   export artifacts. Add the header; leave the rest. If it is wrong, that belongs in an `ANALYSIS-`
   that corrects it, plus a `Superseded by` line on the source. After header insertion, compare the
   preserved body against the original separately from the added metadata.
4. Preserve each source's distinct claims and disagreements in the existing index or analysis.
   A substantial corpus may justify `<docs-root>/raw-research/<topic>/` with its own trigger index;
   a second source alone does not require a folder or another document.
5. Repair navigation before declaring the move complete:
   - Search old full paths, basenames and relative spellings with scoped `rg --no-ignore` across
     possible referrers; include hidden files if relevant. Update mutable inbound references and
     prompt/source pairing headers only within owned paths. Route shared or generated references
     to their source owner rather than editing generated output.
   - Preserve immutable bodies. Put an old-base/old-target → current-target resolution map in the
     allowed provenance header when outgoing or immutable inbound citations cannot be rewritten.
     Give readers an accessible mapping at the original location if incoming navigation needs it.
     If neither method makes the citations usable, retain the original location.
   - Verify exact file targets and fragments from their new bases, or through the explicit map.
     A surviving parent directory or index row does not prove that a citation resolves. Keep
     pre-existing broken links marked unresolved; do not claim they were repaired.
6. Update the Contents table in `<docs-root>/raw-research/README.md` within owned scope, or hand the
   exact index correction to its owner. Record unresolved navigation before returning.

### Renaming is not tidying evidence

Naming can improve discovery while the original filename, body identity and resolution mapping
preserve provenance. A renamed source is only useful if the next reader can still follow its
citations. Do not trade navigation or recoverability for a tidy filename.

## Phase 3 — Promote to tier 3

Promotion is rewriting with claim assessment, not moving a file or accepting a project decision.
Filing-only work can finish at tier 2. Leave an unpromotable or deferred finding there with a reason.

1. Use the project's promoted ledger location; the default is
   `<docs-root>/knowledge-base/research/RESEARCH-YYYY-MM-DD-<topic>.md`.
2. Apply the claim legend in `governance/docs-standard.md` §(f), "The three tiers", and evidence
   validity in `foundation-testing.md`, "Evidence identity and cite-or-run". For each substantive
   proposition, name its support, relevant version/state and limitation. Fetching and quoting a
   source verifies what it states, not its claimed performance or project compatibility. Reserve
   verified status for a stated check supporting that exact proposition; a documentary check can
   verify a proposition about the document. Keep primary attribution and inference distinct.
   Reassess markers on promotion. Cite existing proof if proposition, relevant source and environment
   still match; rerun changed or missing proof, or downgrade. Filing alone does not invalidate proof.
3. Give retrievable sources a URL and actual retrieval date. For supplied local material, retain
   stable provenance/content identity instead of inventing a URL or fetch date.
4. Identify the strategy/spec or decision the finding could inform. Update an accepted commitment
   only within authority for that decision; a proposed feature is not current implemented behavior.
   Otherwise record the recommendation, intended decision owner and deferred/no-change disposition.
   A useful verified constraint may require no contract edit.
5. Add the ledger row with the actual `Promoted into` target or explicit unaccepted/no-change
   disposition. Preserve pending required work in the caller's active work item, not just a
   historical ledger row. Shared index corrections go to their owner.
6. Leave the tier-2 file in place, `Status:` updated. Promotion does not consume the evidence.

## Phase 4 — Clean up

- **Never edit a past finding to make it current.** Write a new dated one; mark the old row
  `Superseded by …`. The ledger's value is showing what was true when a decision was made.
- Set `Superseded` / `Superseded in part` on displaced tier-2 files, with a link forward.
- **Check the repo boundary.** Identify misplaced peer-repo evidence, but retain it unless the
  transfer target and authority are established. Before any authorized source deletion, verify the
  destination contains the exact useful content, remains accessible, preserves privacy and supports
  its citations. A pointer is not a backup. Report retained/deferred material with its next owner.
- Before any authorized bulk archival, identify durable synthesized contracts hiding among raw
  drops and preserve their knowledge and pending acceptance. Do not archive current truth as a dump.
- An expired `Review by:` is a recheck trigger. Record the needed research in the existing work
  item when in scope; do not infer deletion, invalidity or a newly authorized research program.

## Invariants

1. Contracts do not treat inbox claims as verified truth. Forensic reviews and work records may
   cite the exact captured source, content identity and uncurated status without endorsing it.
2. **Only tier 3 may be cited by a contract.** A `docs/raw-research/` path in a strategy or spec doc
   is a defect — promote it or stop relying on it.
3. **Cite-or-run applies to promotion.** The evidence must support the marked proposition, not just
   demonstrate successful retrieval. Shared evidence rules own validity and marker semantics.
4. **`SOURCE-` bodies are immutable.** Provenance header only.
5. **A full inbox is not a failure state.** It is unprocessed input. The failure mode is a source
   never captured because filing it felt like work — which is why tier 1 has no rules.

## Why the linter does not check tier 2

The evidence-store grammar is a curation convention under `governance/docs-standard.md` §(f).
A general taxonomy or path check does not establish provenance, body preservation or claim support;
verify those directly for the files handled.

## Definition of Done

- Every scoped file has a filed, promoted, retained or deferred disposition with provenance.
- Moves preserve exact source bodies, useful content and incoming/outgoing navigation; remaining
  gaps have an owner and no completed-move claim hides a preservation failure.
- Claim markers reflect actual support. Promotion preserves original evidence and does not imply
  accepted strategy or implemented behavior.
- Local-only evidence remains local unless an authorized transfer explicitly covers it. No source
  deletion relies on assumed Git recovery.
- The concise report names actual destinations, verification and limits, and any shared-owner
  follow-up. End durable reports with `What we deliberately did NOT do`.
