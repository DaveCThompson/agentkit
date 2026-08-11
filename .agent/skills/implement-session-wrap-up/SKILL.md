---
name: implement-session-wrap-up
description: Close a session with a cite-or-run verification gate, changelog entry, and archival — light wrap by default; full wrap (distillation, flowback, session log) only on deterministic triggers. Pattern/rule codification and agent health checks have their own skills.
tier: core
---

# Implement Session Wrap-Up

Ensure the repository is left in a "Gold Standard" state with 0 drift between code and
documentation, without re-doing work the session already did. Follow the lifecycle defined by the
four-directory docs model (canonical: `governance/docs-standard.md`).

## Approach

### Phase 1: Technical Gate — cite-or-run (deterministic, never re-run by default)

Do **not** unconditionally run the broad validate. Apply the lifecycle and evidence rules in
`foundation-testing.md` §1:

1. **Identify the boundary.** Is this focused local proof, the final standalone/integrated tree, or
   a release boundary? The boundary decides whether focused proof, the one broad gate, or release
   validation is required.
2. **Collect evidence.** Find the recorded lane, exact commands, real results, and exact commit
   SHA/tree identity in the transcript, a worker report, CI, or a working doc.
3. **Exact state → CITE, don't re-run.** If the evidence covers the exact final SHA/tree and the
   required lane, copy it into the changelog `### Verification` block and state its source (for
   example, "CI run for SHA …" or "run earlier this session; tree unchanged"). A fast-forward does
   not invalidate evidence when the final tree identity is the same.
4. **Otherwise → run only the missing proof.** Run focused proof for the touched change class; run
   the broad gate once when this session owns the final standalone/integrated tree; run release
   validation only when this session crosses the release boundary.
5. **If it fails**: STOP. Report which step failed with specific output. Fix before proceeding.

### Phase 2: Choose the wrap tier (deterministic triggers)

**Light wrap (default).** Applies when the session was docs-only/small, or the gate was citable
per Phase 1. Do only:
- the changelog entry (Phase 4)
- archival + backlog triage (Phase 5)
Then stop — no distillation pass, no flowback, no session log.

**Full wrap.** Required when ANY of these checkable conditions holds:
- behavior, schema, or build surface changed this session — copy/content-only changes
  (user-visible strings, docs prose, no logic or styling) do not count — light wrap suffices
- ≥1 ticket was completed
- `agentkit check` reports LOCALLY-EDITED kit-owned files, or a new local skill/rule was created
Full wrap adds Phases 3 and 6, and the flowback gate below.

### Phase 3: Distillation (full wrap only — the question that decides where truth goes)

Ask: **"What did this session make TRUE that wasn't true before?"** Route each answer:
- **Behavior** (how agents must act from now on) → a rule or skill change, via the `kit-contribute`
  skill (it decides kit vs overlay vs discard).
- **Fact** (what IS true about the system: a contract, a decision, a spec) → `docs/knowledge-base/`
  with the proper prefix (`SPEC- / PRD- / STRATEGY- / RUNBOOK- / DECISION-`), `applies-to:` +
  `last-verified:` frontmatter, and a trigger-table line in the KB README index.
- **Event** (what WAS done) → the CHANGELOG entry only.
Nothing durable may ride to the archive raw — archiving without distilling is truth deletion.

**Flowback gate:** run the `kit-contribute` skill **only if** the `agentkit check` trigger in
Phase 2 fired — any LOCALLY-EDITED kit-owned file, new local skill/rule, or un-codified pattern
gets a disposition (adopt / overlay / defer / discard) before the session ends. If the trigger
did not fire, skip it. **If `agentkit` isn't installed**, detect the drift with `git status`/`git
diff` over `.agent/` and follow `kit-contribute`'s CLI-absent path (edit source, leave vendors
stale, log "sync pending", flag the user) — absence of the CLI is not a reason to skip flowback.

### Phase 4: Changelog (both tiers)

- [ ] Add a dated entry to `CHANGELOG.md` — what/why, a `### Verification` block (the exact
      commands + observed results from Phase 1, cited or run), and a **`KB consulted:`** line
      naming the KB docs read this session (or "none").
- [ ] Roll per the project convention when the file exceeds its threshold — harvest durable facts
      into the KB first.

### Phase 5: Ticket closeout & archival (both tiers)

**Drift-proof ticket closeout — run for every ticket this session completed.** This is the
executable form of `pattern-docs-artifacts.md`'s status-of-record contract: it keeps the ticket's
status honest against git reality so a "done" ticket never sits "open" in an index (the exact drift
the hygiene check in `agentkit check --hygiene` flags). `/ship` routes its Phase 4 here; `/wrap-up`
runs it directly.

- [ ] **Flip status + cite the SHA (per completed ticket)**: set the ticket's `**Status**` → `Done`
      (or `merged`) and cite the completion **commit SHA** in the ticket body. This makes "done"
      machine-checkable — `agentkit check --hygiene` proves the cited SHA is an ancestor of the main
      branch. Convert the ticket to an execution record: plan XOR record, never both.
- [ ] **Fix every referencing doc (anti-drift step)**: grep the ticket ID/filename across `docs/`
      and update every row/link that referenced it — `working/README`, `backlog/README`, any
      source-of-truth/status board, KB indexes. A referencing row that survives after its ticket
      moved is a live routing defect. This is why closeout is *ticket-scoped*, not session-scoped.
- [ ] **Deletion-impact sweep (session-scoped)**: run
      `git diff --name-status --diff-filter=DR <session-base>...HEAD`. **Empty result → done, this
      costs nothing.** Otherwise run the canonical procedure defined in `implement-session-land`
      §2.0 against the session's removed names — grep `docs/knowledge-base/`, `.agent/rules/` and
      its mirrored vendor dirs, `docs/working/`, `docs/backlog/` with `rg --no-ignore`; fix or ticket
      every hit before closing; re-verdict any live ticket whose `**Files**` line names a deleted
      path. Ticket-scoped closeout above catches the ticket's *own* filename; this catches what the
      **code** removed, which is the class that produced a retired-icon mandate surviving inside an
      agent rule.
- [ ] **README-trim**: after archiving, trim the README's historical rows. **README = forward
      index** (what exists + what's next); **CHANGELOG/archive = historical record**. Do not let
      completed-work rows accumulate in the forward index.
- [ ] **Archive by month**: Move completed tickets from `docs/working/` (or `docs/backlog/`) to
      `docs/archive/YYYY-MM/` (derive the month; never hardcode).
- [ ] **Backlog triage**: Move unstarted or deferred items from `docs/working/` to `docs/backlog/`.
- [ ] **Untracked-docs hygiene**: run `git status --porcelain` and flag untracked or uncommitted
      files under `docs/` and other managed dirs. The artifact rules govern *where* docs go, not
      that they get *committed* — an untracked ticket is never on origin and one `git reset` from
      gone. Parallel/worktree runs make this acute (worktrees are discarded on cleanup). Commit
      durable docs before closing, or state explicitly why a file stays uncommitted.

### Phase 6: Session log (full wrap only — the exception, not the default)

The changelog entry is the default session record. Create
`docs/archive/2026-MM/LOG-[session-name].md` **only** when the work spans sessions and a future
agent needs handoff context the changelog entry cannot carry (key decisions, remaining blockers,
next steps). Update `docs/working/README.md` with current status if applicable.

### Phase 7: Branch closure decision

`wrap-up` is run frequently, so it must be safe both as a checkpoint and as the end of a session.
Always inspect `git branch --show-current`, `git status --short`, and the branch's relationship to
`origin/main` after Phases 1–6:

| State | Action |
| --- | --- |
| `main` | Record that there is no session branch to close. |
| Feature branch with incomplete work, dirty owned files, pending verification, or an explicit next step | Retain the branch and report `retained: active work` with the exact reason. |
| Feature branch with a clean tree, required evidence, no open remainder, and a completed-session signal | Route to `implement-session-land` in the same session. Land owns the final-tree gate, push, release-tree closure audit, and local branch deletion. Do not duplicate those operations in wrap-up. |
| Feature branch already merged into `main` | Switch to `main` and delete the local branch with `git branch -d`; report the removed ref. |
| Diverged, dirty foreign worktree, or ambiguous ownership | Retain the branch and stop at a named blocker; never force-delete or infer completion. |

The completion signal may be an explicit user request to finish/land, a completed ticket with no
open remainder, or a workflow that deliberately invokes `land`. A routine checkpoint is not a
completion signal. `wrap-up` never deletes an unmerged branch directly; it delegates completed
branches to `land` or retains them with a reason.

### Optional: reviewer buy-in package (only when the session needs sign-off)

When the work needs a reviewer's approval — a PR, a stakeholder demo, a shareable "here's what I
built and why" — package it into one `docs/working/REVIEW-<name>.md` (or a PR description) built for
a skeptic, in this order:
1. **Visual demo** first (GIF/screenshot) if there's a user-facing change; ask for one if missing.
2. **Problem + chosen approach** in ≤2 paragraphs.
3. **Hardest questions answered** — the 3–5 objections a domain expert would raise (edge cases,
   scale, failure modes, migration), answered honestly. Naming a real weakness builds credibility;
   hiding it destroys it.
4. **Deviations** from the plan, and explicit **out-of-scope** boundaries.
Keep it to one page with links to the full artifacts. This is the buy-in-facing counterpart to
`handoff` (which is implementer-facing) — reach for it only when someone must approve the work, not
on every wrap.

## Verification / Definition of Done

- [ ] The `### Verification` block names the lifecycle point, exact commands + real results, and
      the exact SHA/tree identity — cited when it matches or actually run at this phase. Never
      "all green" without evidence.
- [ ] The wrap tier chosen is stated, with the trigger that chose it.
- [ ] `docs/working/` holds only in-flight items; completed work is archived, unstarted work is
      in backlog.
- [ ] Every completed ticket is flipped to `Done`/`merged` with its completion SHA cited, every
      referencing doc updated, and the README trimmed to a forward index (drift-proof closeout).
- [ ] `git status --porcelain` shows no unexplained untracked/uncommitted files under `docs/`.
- [ ] Branch closure decision recorded: landed and deleted, already-merged and deleted, or retained
      with an exact active-work/blocker reason. A clean completed feature branch must not be left
      unexplained.
