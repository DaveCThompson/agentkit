---
name: implement-session-land
description: Land a finished session on origin/main — wrap-up gate + changelog, backlog/working premise-swept and archived, status-of-record and READMEs current with next steps, worktrees safely pruned, fast-forward merge to main pushed. The terminal step of the session lifecycle; ship takes one ticket to done, land takes the whole session home.
tier: core
---

# Implement Session Land

Take a completed session from "all work committed on a session branch" to "on `origin/main`, docs
fully cleaned, changelog correct, next steps visible to a cold reader." This skill SUPERSETS
`implement-session-wrap-up` (which it invokes) — wrap-up closes the session's record; land also
cleans the doc stores, prunes worktrees, and performs the merge + push. Never run it mid-session.

## When NOT to use
- Mid-session, or with uncommitted session work — commit first (`git-protocol.md` §6.3 pathspec form).
- When main and the session branch have BOTH moved (true divergence) — that is `git-protocol.md` §7
  territory (preview, reconcile-by-doc, supersede); this skill fail-closes onto it, it does not
  replace it.
- For landing a single worker ticket — that is `worker-report` + `orchestrate-merge-train`.

## Approach

### Phase 0: Preconditions (fail closed)
1. On a session branch, never `main` (`git branch --show-current`).
2. All session work committed. `git status --short` may show ONLY foreign dirt (another session's
   files, user-moved directories) — name each foreign path in the report and NEVER stage it; every
   commit this skill makes is by pathspec.
3. If any background workers/agents from this session are still running: wait or stop them first.

### Phase 1: Wrap (delegate)
Run `implement-session-wrap-up` in full: cite-or-run lifecycle-aware technical evidence, changelog
entry with real `### Verification` evidence, codify/flowback gate. Additions at land tier:
- **Version bump** when the session added features or changed CLI/asset behavior (semver minor for
  features, patch for fixes) — bump `package.json`, then self-sync so the compiled manifest picks
  up the version, then re-run sync to prove idempotence (0 writes).
- The changelog must cover EVERY commit landing on main — including earlier unreleased commits the
  branch carries (check `git log origin/main..HEAD` against the changelog; a commit span with no
  entry is a gap to fill, not a footnote).

### Phase 2: Docs deep-clean — backlog + working premise sweep

#### 2.0 Deletion-impact sweep (CANONICAL DEFINITION — other skills point here, never restate it)

**The diff defines the scope, not your memory.** Deleting code is the moment docs become false, and
it is the moment nothing was watching: an icon library was retired while four specs *and an agent
rule* still mandated it, two API routes survived as whole spec sections, and a backlog ticket sat
marked "required follow-up" after a later wave deleted every file on its `**Files**` line.

1. **Enumerate from git**, never from recollection:
   `git diff --name-status --diff-filter=DR <merge-base>...HEAD`. Add the exported symbols, scripts,
   routes, and dependencies those changes remove. **If it returns empty, this sweep is done** — the
   common case must cost nothing, or the step gets routed around.
2. **Grep five surfaces** for every removed name, matching markdown links **and** backticked or bare
   mentions: `docs/knowledge-base/`, `.agent/rules/` **plus the mirrored vendor rule dirs**,
   `docs/working/`, and `docs/backlog/`. Use `rg --no-ignore` — `docs/archive/` and
   `docs/raw-research/` are `.ignore`-excluded, and "no matches" from an excluded tree is
   byte-identical to "searched, nothing there".
3. **Rules are docs too, and they are the sharpest case.** A stale spec misleads a reader; a stale
   *rule* instructs every agent on every future session. Treat a hit in `.agent/rules/` as
   fix-before-done, not fix-eventually.
4. **A deleted path on a live ticket's `**Files**` line means that ticket's premise changed.**
   Re-verdict it — `blocked`, re-scoped, or archived with a dated reason. Never leave it standing;
   that is how two program waves ran past a ticket whose whole surface was gone.
5. **Every hit is fixed or ticketed before "done."** A hit recorded in a report and carried forward
   is the drift, not a record of it.

#### 2.1 Premise sweep
1. **Sweep** every `TICKET-`/`PLAN-`/`IDEA-`/`PRD-` in `docs/working/` + `docs/backlog/` with the
   premise discipline (`orchestrate-sequence` Phase 2.6 shape): claimed Status vs reality — grep
   `CHANGELOG.md`, `git log`, and spot-check cited files. Verdict per doc:
   **DONE-ARCHIVE** (work shipped; the doc is a record), **ACTIVE-KEEP**, or **STALE-FLAG**
   (status contradicts reality — fix the status line or archive with a dated note; never leave the
   contradiction). Parallelizable: this sweep is safely delegated to a cheaper-model subagent as
   read-only report; the archive/keep decision stays with the landing session.
2. **Archive** DONE docs to `docs/archive/YYYY-MM/` via `git mv` (keeps history), then update every
   index that names them — `docs/backlog/README.md`, `docs/working/README.md`, the archive index if
   one exists. `agentkit check . --taxonomy` (dead-index lint) arbitrates: a moved file still named
   in an index is a finding. A DONE `PRD-` is **dissolved, not just archived**: landed subset →
   `SPEC-`, unlanded remainder → strategy/backlog, record → archive with a closing header — the
   contract is `governance/docs-standard.md` §a; never `git mv` a PRD into the KB.
3. **Status-of-record** (`PROGRAM-STATUS.md` or the repo's equivalent): rewrite to current truth —
   version, active front, what shipped this session, open remainder. Apply the self-contradiction
   lens (`audit-docs` step 7) to the result: its header must not contradict its body.
4. **Next steps visible**: `docs/working/README.md` and `docs/backlog/README.md` each carry a short
   current "what's live / what's next" line or section, so a cold session orients without
   archaeology. An empty backlog is stated as empty, not left implicit. **It points, it does not
   restate** — name the file that owns the truth (`pattern-docs-artifacts.md`, status-of-record
   contract); never copy `Status`/`Priority`/`Agent Tier` out of a ticket header into a README row.
5. **Ownership-first ordering** — when this deep-clean scrubs content, take the surfaces **no program
   owns** first: docs ported in from another repo, runbooks, strategy docs, anything with no live
   ticket pointing at it. Drift concentrates where nobody was assigned; actively-worked specs are
   half-maintained by the work itself. This is the cadence — there is no separate schedule.

### Phase 3: Worktree cleanup (safe — never delete work)
1. `git worktree list --porcelain` — enumerate non-primary worktrees, including any under the
   orchestration root (`.claude/worktrees/`, or the manifest's `worktreeRoot`).
2. For each: `git -C <wt> status --porcelain`. **Dirty → never delete**; report it as held.
3. Clean AND its branch is merged into main (`git branch --merged main`) or the branch is gone →
   `git worktree remove <path>`. Never `rm -rf` a worktree directory directly — it corrupts
   `.git/worktrees` metadata; `git worktree prune` afterward clears stale metadata.
4. Report each removal and each hold with its reason.

### Phase 3.5: Release-tree closure audit
The landing session is not complete while the release tree is surrounded by abandoned local
branches or worktrees. This audit is mechanical and runs after the final tree is known:

1. Enumerate local branches with `git branch --format`, and remote branches after `git fetch --prune
   origin`. Classify each non-main branch as `merged`, `unmerged`, or `unknown` against the final
   main SHA. Never infer a branch's state from its name or age.
2. Delete clean local feature/fix/release branches that are merged into final `main` with
   `git branch -d`. Keep `main`, protected branches, and any unmerged/unknown branch; report every
   retained branch with its reason. A branch checked out by a held dirty worktree is never deleted.
3. Remote branch deletion is a separate outward mutation. When the user or repository policy
   explicitly authorizes stale-tree cleanup, delete only merged feature/fix/release branches with
   no held worktree, then verify the remote refs are gone. Otherwise report them as retained rather
   than silently deleting them.
4. The closure receipt must include: removed local branches, removed worktrees, held dirty trees,
   retained unmerged branches, remote deletions (if authorized), and the final `origin/main` SHA.
   A clean close has no unexplained branch/worktree residue.

### Phase 4: Land on origin/main (fail closed)
1. `git fetch origin`, then measure: `git rev-list --left-right --count origin/main...HEAD`.
   - `0 <N>` (ahead only) → proceed: fast-forward is possible.
   - non-zero BOTH sides → **STOP**: true divergence; route to `git-protocol.md` §7 (in-memory
     `merge-tree` preview, reconcile-by-doc, supersede) — never blind-merge, never force.
2. `git checkout main` → `git merge --ff-only <session-branch>` (ff-only is the guard: it cannot
   invent a merge state that was never gated).
3. **Verify the final main tree at the correct boundary.** Reuse branch or CI evidence when it
   covers the exact final SHA/tree; a fast-forward alone does not require an identical rerun. If no
   broad final-tree evidence covers main, run the one broad gate on main. If this land crosses a
   release boundary, run release validation once as well.
4. `git push origin main`, and push the session branch as its record. Delete the merged local
   session branch (`git branch -d` — the `-d` guard refuses unmerged), then complete Phase 3.5.
   Remote session-branch deletion only on explicit user instruction.
5. Confirm: `git rev-list --left-right --count origin/main...main` → `0 0`, and re-run the branch /
   worktree inventory so the closure receipt describes the post-push state.

### Phase 5: Report
What landed (SHA span, headline changes), gate evidence (real commands + real pass lines), docs
archived (count + where), worktrees removed/held, and the next steps now recorded in the READMEs.

## Constraints
- Never `git stash`; never stage foreign dirt; pathspec commits only (`git-protocol.md`).
- Never land on a red gate — a failing tier stops the landing, it does not get annotated around.
- Every count or SHA written into the changelog/status/report is cite-or-run
  (`foundation-testing.md` §1B) — measured this session, never recalled.

## Definition of Done
- [ ] `origin/main` == local `main` == the session's final state; the required final-tree or
      release evidence covers that exact SHA/tree.
- [ ] `docs/working/` + `docs/backlog/` contain only ACTIVE docs; archives indexed; no dead index
      entries (`check --taxonomy` clean or baseline-stable).
- [ ] Status-of-record and both README "next steps" reflect the post-land reality.
- [ ] Changelog covers every commit that just landed; version bumped when warranted.
- [ ] No stale worktrees; no held worktree unreported.
- [ ] Release-tree closure audit completed: every local/remote branch is removed, retained with a
      reason, or explicitly protected; no merged feature branch is left as unexplained residue.
