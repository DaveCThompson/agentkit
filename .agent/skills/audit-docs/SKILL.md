---
name: audit-docs
description: Documentation drift detection and knowledge-base hygiene. Use after major changes or for periodic maintenance.
tier: core
required-tools: [agentkit]
---

# Audit Docs Skill

Logic for ensuring documentation integrity and preventing "Documentation Rot".

## Role: REVIEWER — read-only

Read the scoped documents and return findings in the caller's requested report or conversation.
Do not edit, move, archive or delete audited documents. `maintain-docs` applies authorized corrections
and rechecks their premises. That transition does not require another agent or repeat approval when
the user's existing request already authorizes maintenance.

## The finding schema (the handoff artifact)

For each material finding, use this shape so `maintain-docs` can re-check it before acting:

```
- file:        <path>
  quote:       "<the EXACT current text, copied — not paraphrased>"
  correction:  <what it should say>
  evidence:    <symbol, section, command output, or SHA that proves it — never a bare line number>
  verdict:     drift | stale | contradiction | dead-reference | uncertain
```

`uncertain` is a first-class verdict, not a failure. A finding you cannot evidence is still worth
reporting — it just must not be dressed as a fact. Anchor `evidence` to symbols and sections;
`governance/docs-standard.md` §(i) requires durable references to carry context. Line numbers need
a source identity because they become ambiguous after an edit. Preserve useful
historical citations with their exact source state.

## Instructions

1. **Verify Spec Isolation**:
   - Check `docs/specs`.
   - Under the default layout it must be absent or empty. Durable specs belong flat in the
     declared KB root (`docs.kbRoot`, default `docs/knowledge-base`). If files
     exist in `docs/specs`, classify them and propose destinations under the artifact policy.
     Respect declared layout exceptions.
   - Check `SPEC-*` outside that root, including working drafts. Prospective requirements belong
     in the accepted ticket, PLAN or PRD; current truth belongs in the KB. Preserve sanctioned
     nested layouts and remaining work before proposing a destination.

2. **Verify Rule Coverage**:
   - Trace recent `./CHANGELOG.md` entries or feature implementation plans.
   - Check whether changed behavior contradicts applicable rules or leaves a material documentation
     gap. A new pattern does not automatically warrant a new rule.
   - Identify "Rule Drift" — where code behavior deviates from documented standards.

3. **Link Integrity — delegate to the CLI; do not hand-roll it**:
   - Run `agentkit check --content`. It owns markdown links, backticked and bare repo paths,
     `npm run` script names, CI job names, `.agent` asset references, and `:line` citations, and it
     resolves each against the citing file's directory, then the repo root, then the kit.
   - Run `agentkit check --taxonomy`. Inspect its reported roots and both index directions:
     missing index targets and unindexed files where that consumer supports them. Check the declared
     KB root explicitly if the installed version omits it; missing coverage is not a clean scan.
   - Check external URLs and in-page anchors where needed. Use targeted source/path checks for
     suspicious results and known limitations, including old paths after a move. A lenient checker
     can pass some non-code example tokens when their parent exists. Working/backlog bodies,
     archive/evidence bodies, external URLs and anchors are not a universal content-check guarantee.
   - Preserve evidence-backed disagreements with the checker and identify its coverage limit.
     If the CLI is unavailable, report that gap and perform bounded direct checks. A green command
     is not proof that prose, targets or status claims are true.

4. **Backlog Index Integrity** (only where the project keeps an indexed backlog store):
   - Discover the actual live stores. An ephemeral `backlog-status` view does not imply that a
     backlog directory is absent. Skip index checks only for stores without an index contract.
   - `agentkit check --taxonomy` already enforces this mechanically in both directions
     (`unindexed-doc` and the dead-index lint). Read its output rather than re-deriving the list.
   - **Enumerate from the filesystem if you verify by hand.** Glob the directory; the index is the
     claim under test, never the enumerator. A bulk pass that took its denominator from an index
     missed the one ticket that had never been indexed — which is the whole reason this lens exists.

5. **Archival Integrity**:
   - Check completion evidence and remaining acceptance before recommending archival of PRDs or
     plans marked implemented. Pending work must remain discoverable or have an explicit successor.
     Check incoming and outgoing navigation, including links from immutable source records.

6. **Status-Drift Check**:
   - Plans and status docs carry point-in-time state that rots (a cover plan claimed "Phase 1
     complete on branch X (uncommitted)" long after that branch was merged and deleted).
   - Check present-tense branch and integration claims against the actual ref and ancestry.
     A missing local ref does not prove remote deletion, integration or completed acceptance.
     Preserve historical statements in their dated context. Pair with the content-freshness scrub
     in `docs-standard.md`.

7. **Self-contradiction Check**:
   - Flag any doc whose header/Status line contradicts its own body (e.g., header says "in
     progress" while the body describes shipped work; a "DESIGN — unresolved questions" status
     over a body whose questions are all answered).
   - Distinct from step 6, which checks a doc's claims against git reality; step 7 checks the doc
     against itself and needs no git.

## Constraints
- Do not change audited documents. Return the report to the caller or authorized `maintain-docs` owner.
- Use `rg --files` or `Get-ChildItem -Recurse` for isolation checks.
- Reuse CLI coverage once; targeted checks may corroborate or challenge it with concrete evidence.
- Any grep over `docs/` uses `--no-ignore`: `docs/archive/` and `docs/raw-research/` are
  `.ignore`-excluded, and an excluded tree's "no matches" is byte-identical to "searched, nothing
  there" (`governance/docs-standard.md` §(f)).
- Propose destinations and preservation requirements; do not perform moves or deletions in an audit.
- Keep necessary redacted evidence in the caller's approved location and cite its identity.

## Output
Each selected lens is `finding | checked-clean | not-applicable | not-verified`, with scope,
reason and a next check/owner for missing proof. Follow `foundation-testing.md` for evidence
validity. Zero findings is valid; incomplete coverage cannot establish a full pass.
Findings use the schema above (quote → correction → evidence → verdict) so `maintain-docs` can apply
them directly. Findings report highlighting:
- [ ] Stray specs found
- [ ] Missing rule coverage
- [ ] Broken documentation links (including stale README trigger-table entries)
- [ ] Orphaned active PRDs
- [ ] Status drift (dead branches, "uncommitted" claims for merged/deleted branches)
- [ ] Self-contradiction (header/Status line disagrees with the body it heads)

## Definition of Done

The scoped claims have evidence-backed findings or explicit gaps. Proposed moves preserve useful
content and navigation. No audited document was changed; the authorized maintenance owner receives
the existing report identity.
