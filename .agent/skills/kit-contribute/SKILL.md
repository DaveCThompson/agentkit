---
name: kit-contribute
description: Judge and route local agent-system changes at session end — flow improvements back to the kit, promote project-specific content to overlay, codify new patterns into rules, or discard noise. Use at wrap-up, or whenever check reports LOCALLY-EDITED core files.
tier: core
triggers: [wrap-up, flowback, contribute, codify, locally-edited]
conflicts-with: [pattern-codify]
---

# Kit Contribute — the flowback brain

One decision point for everything the session changed about the AGENT SYSTEM itself (skills, rules,
workflows). Improvements made here must land in the kit or become overlay **within one session** —
improvements that stay local are how consolidation attempts die.

The agentkit CLI's path is embedded in the SessionStart hook command inside `.claude/settings.json`
(look for `agentkit.mjs`). Below, `agentkit <verb>` means `node "<that path>" <verb>`.

**CLI-absent degraded path (deterministic, not improvised).** If `agentkit` isn't installed in this
environment (no `agentkit.mjs` resolvable), do NOT skip flowback and do NOT hand-edit vendor copies
to fake a sync. Instead:
1. Detect drift by hand — `git status`/`git diff` over `.agent/` (and any new local skill/rule) —
   the same items Phase 1's `check` would surface.
2. Edit the `.agent/` **source** only; leave the vendor copies (`.claude/`, `.agents/`, `.gemini/`,
   `.opencode/`) stale.
3. Record each item's disposition **plus a `sync pending` note** in the session changelog, and flag
   to the user that `agentkit sync` must run to regenerate vendor surfaces and the lockfile.
A stale vendor copy with a logged "sync pending" is honest; a hand-edited vendor copy that simulates
a sync is drift that the next real sync will fight.

## When to Use
- During `/wrap-up` (this skill is its codify/flowback gate).
- When session-start `check --quick` reports LOCALLY-EDITED files or a >7-day flowback nag.
- Immediately after deliberately editing any kit-owned file.

## Approach

### Phase 1: Detect
- [ ] Run `agentkit check . --json`. Collect: LOCALLY-EDITED / CONFLICT core files, plus any NEW
      local skills/rules/workflows the kit doesn't ship (they appear as untracked overlay).
- [ ] Also ask the pattern-codify question: did this session establish a new pattern, convention,
      or architectural decision that is NOT yet written anywhere? (If yes, it enters Phase 2 as a
      candidate rule/skill even though no file is drifted.)

### Phase 2: Judge each item (the three-way routing)

**Step 0 — Codification gate (provenance check, `pattern-agent-orchestration.md` §1):** before
routing anything, determine each learning's producer — the completion report's `producer` field, or
this session's own tier/model if the learning is session-local. **Junior-produced or
provenance-absent learnings are `candidate`s, not adoptable items**: file them in the live feedback
pool (`docs/backlog/IDEA-post-v06-feedback.md`) with a `**Provenance**:` line and route them no
further. Adopt/codify a candidate only after a senior/staff role re-verifies the evidence (prefer
re-running the claim to T1/T2 strength; cite the re-verification in the changelog entry).

For every drifted core file, new local asset, or un-codified pattern that passes the gate, decide:

1. **General improvement** → the fleet should have it.
   - Generalize FIRST: strip project paths, domain nouns, project-specific tool names (the kit's
     `governance/best-practices.md` defines the bar). One concern per file.
   - `agentkit adopt <file>` — if it refuses because the kit moved ahead, read the 3-way base it
     prints, merge deliberately, retry. Never `--force` without reading the diff.
   - Not sure it generalizes? `agentkit adopt <file> --defer` parks it in the flowback queue
     (doctor surfaces it later) — deferring beats deciding badly.
2. **Project-specific** → promote to overlay.
   - Rename to a `domain-*`/`project-*` name (routing names must stay unique — check reports
     collisions), ensure `.agentkit.json` overlay globs claim it, and revert the kit-owned original
     with `agentkit sync` if the edit lived on a core file.
3. **Noise** → discard.
   - Revert via `agentkit sync --force` on that file (after confirming with the diff) and note the
     discard + reason in the session log.

### Phase 3: Verify
- [ ] Re-run `agentkit check .` → zero LOCALLY-EDITED core files remain (overlay files are fine).
- [ ] If anything was adopted: note in the project CHANGELOG entry ("adopted to kit: <files>") —
      the kit CHANGELOG got its provenance entry automatically.

## Definition of Done
Every item from Phase 1 has exactly one disposition (adopted / deferred-with-queue-entry /
overlay-promoted / discarded-with-reason / filed-as-candidate-with-provenance), `check` is clean of
unexplained core drift, and **no junior-produced or provenance-absent learning was adopted without a
cited re-verification**.

## What this skill replaces
`pattern-codify` (its codify-at-session-end question is Phase 1's last bullet; rule-writing
guidance lives in `governance/best-practices.md`) and the old `health-agent` remediation ("sync by
copying" — the materialized-copy engine; never do that).
