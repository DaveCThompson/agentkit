---
description: Session exit protocol — cite-or-run technical gate, changelog, archival, and opportunistic branch closure; full wrap (codify, session log) only on deterministic triggers.
skill: implement-session-wrap-up
---

# Wrap-Up Workflow

The mandatory exit protocol for feature work: verify (or cite existing verification), record the
session, archive — and codify learnings only when a deterministic trigger fires.

## Goal
Session finalized with a passing (or truthfully cited) technical gate, artifacts archived, the
changelog updated, learnings codified when — and only when — something new emerged, and the session
branch either landed and closed or was explicitly retained for active work.

## Inputs required (ask if missing)
- None (global finalization).

## Skill routing (explicit)
- `implement-session-wrap-up` — drives the cite-or-run gate, wrap-tier choice, archival, and
  progress reporting.

## Procedure
1. **Load skill**: Read `implement-session-wrap-up`'s `SKILL.md`.
2. **Technical gate (cite-or-run)**: If the graduated gate already ran this session with recorded
   results and no code changed since (`git status --short`), cite those results — do NOT re-run.
   Otherwise run only the missing tiers for this session's change class. If any fail: **STOP** and
   notify the user.
3. **Wrap tier**: Light wrap (changelog + archival) is the default. Escalate to full wrap only on
   the skill's deterministic triggers (behavior/schema/build change, ticket completed, or
   `agentkit check` reports LOCALLY-EDITED / new local skills or rules).
4. **Codify gate (full wrap only)**: Delegate the codify decision to the `kit-contribute` skill —
   it decides whether the learning belongs in a project rule/overlay or should be promoted
   upstream to the kit.
5. **Cleanup & archival**: Move superseded working plans to `docs/archive/`; move unstarted items
   to `docs/backlog/`.
6. **Changelog**: Update `CHANGELOG.md` with the session summary, a `### Verification` block
   (cited or run), and a `KB consulted:` line.
7. **Summarize (full wrap only, exceptional)**: Write a `LOG-` session note only when a future
   session needs handoff context the changelog entry cannot carry.
8. **Branch closure decision**: Inspect the current branch and tree. If the session is complete,
   route to `implement-session-land`; it owns the final push, release-tree audit, and branch
   deletion. If this is a checkpoint or work remains, retain the branch and state the exact reason.
   Never delete an unmerged branch directly from wrap-up.

## Notes
- Run after `/build` or any significant change. The codify decision is owned by `kit-contribute`,
  not this workflow.
- Run often: a checkpoint must not close active work, while a completed clean branch should not be
  left behind when `land` can safely close it.
- The changelog entry is the default session record; `LOG-` files are the exception.
