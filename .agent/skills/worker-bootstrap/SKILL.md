---
name: worker-bootstrap
description: Cold-start a parallel worker — isolate (worktree or disjoint shared tree), verify the environment deterministically, then orient on the ticket. Use as the first step of any worker assignment, before a single line of code changes.
tier: core
---

# Worker Bootstrap

Cold-start protocol for one worker in a parallel wave. Everything two roles must agree on lives in
`pattern-agent-orchestration.md` (the kernel) — this skill is the worker-side playbook for getting
from "assigned" to "provably ready". WHY: a worker that starts on the wrong base, with missing deps,
or on an already-red gate produces failures nobody can attribute. Bootstrap makes every later
failure *yours*. Headline hazard: harness worktree isolation has branched workers off a base
~56 commits stale — the ticket's declared files didn't exist, and only worker discipline caught it.
Phase 3's stale-base gate exists so the *gate* catches it, never model judgment.

## When to Use

- You were assigned a ticket by an orchestrator and have not yet touched the repo.
- Re-bootstrapping after your worktree/branch was invalidated (main moved, deps changed).

## When NOT to Use

- Ready to implement (environment already verified) → `worker-execute`.
- Work finished, closing out → `worker-report`.
- You are the orchestrator partitioning or kicking off a wave → the `orchestrate-*` skills.
- Solo (non-parallel) session start → `project-onboard` directly; this skill only adds value when
  isolation and blame-attribution matter.

## Approach

### Phase 1: Ingest the assignment
1. Read the assigned `docs/working/TICKET-<name>.md`. Extract the kernel §2 metadata:
   `**Agent Tier**`, `**Files**` (your declared surface), `**Depends**`, `**Parallel-safe-with**` /
   `**Conflicts-with**`.
2. Read the `orchestration` block in `.agentkit.json`: `mainBranch`, `branchNamePattern`,
   `isolationMode` (the kickoff may override per wave), `worktreeRoot`.
3. If any of ticket, isolation mode, or base ref is missing from the kickoff — STOP and ask the
   orchestrator. Never guess a base or a surface.

### Phase 2: Isolate (per kernel §5 mode)
**`worktree` mode** — fresh tree off latest main, own dependency install:
```bash
git fetch origin <mainBranch>
git worktree add <worktreeRoot>/<ticket-id> -b <branchNamePattern-resolved> origin/<mainBranch>
cd <worktreeRoot>/<ticket-id> && <pkg> install   # per-worktree install, no sharing
```
A harness worktree capability is an accelerator only — the raw `git worktree` commands above are
the fallback and always sufficient. If `git worktree` itself is unavailable, a fresh clone at the
same base commit is the degraded equivalent.

**`shared-tree-disjoint` mode** — one tree, disjoint surfaces, no reinstall:
1. `git status --short` MUST be empty — a dirty shared tree means another worker's edits are in
   flight; STOP and flag, do not "work around" (and never `git stash` — `git-protocol.md`).
2. Confirm the tree sits on the wave's base commit (Phase 3, check 1).
3. Confirm your assigned `**Files**` globs do not intersect any other worker's surface as listed in
   the kickoff. Deterministic check: expand each glob set and intersect the path lists — empty
   intersection or STOP.
4. Create your branch per `git-protocol.md` §1 (fresh branch, never on main).

### Phase 3: Deterministic environment check — BEFORE touching code
All three must pass; each is a checkable fact, not a judgment call (kernel §8). Base-correctness
(check 1) and base-green (check 3) are **separate hard gates** — a green gate on the wrong base is
still a failed bootstrap. This gate is the **non-negotiable, single-writer invariant**: a worker
that skips it (e.g. "the base looks recent enough") has already violated the kernel (§8
deterministic gates over model judgment) and must be stopped. R12 reaffirms: the stale-base gate
is the structural guard that prevents the wave's foundational failure mode — do not weaken it,
do not add exceptions, do not allow model judgment to override it.
1. **Right base — the stale-base HARD gate.** Isolation tooling (harness worktrees included) can
   silently branch you off a base dozens of commits behind the integration branch. Before ANY edit:
   - **(a) Declared surface exists**: every concrete path in the ticket's `**Files**` MUST exist on
     this base, and every glob MUST expand non-empty (for a new-file ticket, its declared parent
     dir exists). Absent files = you are not on the base the ticket was written against.
   - **(b) Ancestry**: `git rev-parse HEAD` equals the kickoff's base commit, and if the
     orchestrator passed a resolved integration-base SHA,
     `git merge-base --is-ancestor <sha> HEAD` MUST exit 0.
   - **(c) Heal or STOP**: on mismatch, heal to the integration branch — `git reset --hard
     <branch>` if you have zero local commits, else `git merge --ff-only <branch>` — then re-run
     (a) and (b). Cannot heal cleanly? STOP and report **"stale base"** as a distinct terminal
     status. NEVER "adapt the plan" to whatever files you find — building on a stale base is
     building on sand, and the deterministic gate carries this check, never model judgment.
2. **Deps present**: the install command exited 0 and the lockfile was honored (frozen/ci install
   where the project supports it). No install output = no evidence.
3. **Base-green — a BLOCKING gate, not a note**: run the graduated gate (`foundation-testing.md`
   §1) on the PRISTINE base, at least at the always tier (`lint` + `typecheck`), plus the focused
   tests of the domain your ticket will touch. Red on the untouched base → STOP and report
   **"environment not green"** as a distinct terminal status; NEVER proceed and later attribute
   failures to "pre-existing". WHY non-optional on a heterogeneous fleet: native deps make
   environment breakage impersonate codebase breakage — an `npm ci` that failed to rebuild a
   native module presents as red tests on clean code. Green here is the blame line: a red gate
   *after* your edits is now provably caused by them.
4. **Discovery mode — record, don't gate.** Probe MCP reachability with one cheap call (e.g.
   `list_projects`); a spawned worker should EXPECT this to fail — MCP tools do not propagate to
   subagents (`use-codegraph` Step 0). Record which mode you're in (`graph` | `grep`) in the Phase 5
   readiness declaration, so discovery mode is a bootstrap-time fact, not a mid-task discovery.

### Phase 4: Orient
1. Run `project-onboard`, scoped: the ticket, the docs the kickoff routed to you, and the 1–3
   governing KB docs for your surface — not the whole knowledge base.
2. Run `implement-flight-check`: plan/ticket loaded, target files viewed, paths in the plan exist.
3. **Transplant/vendored ticket?** (the `**Complexity-note**` flags a rewrite-not-a-copy.) Plan the
   standard opening move for `worker-execute`: **port the upstream characterization / pure-logic
   tests FIRST**, get them green against the vendored code as-is (a byte-for-byte golden master),
   then refactor under them. WHY: the test port is cheap and turns a risky rewrite into a
   test-anchored one — never refactor transplanted code before its behavior is pinned.

### Phase 5: Declare ready
Report readiness to the orchestrator in your reply channel. Do NOT write the Status Board — it has
exactly one writer, the orchestrator (kernel §6). Then proceed to `worker-execute`.

## Verification / Definition of Done

- [ ] Isolation matches the wave's declared mode; in shared-tree mode, surface disjointness was
      computed (path-set intersection), not assumed.
- [ ] Base commit verified by `git rev-parse` / `git merge-base` output — recorded, not remembered.
- [ ] Stale-base gate passed: ticket's `**Files**` surface exists on the base, and any resolved
      integration-base SHA is an ancestor of HEAD — or the base was healed and re-verified, or the
      worker stopped with terminal status "stale base".
- [ ] Dependency install exited 0 in this environment.
- [ ] Graduated gate ran green on the untouched base; commands + results captured for later
      contrast in the §3 completion report — or the worker stopped with terminal status
      "environment not green". No third path.
- [ ] Ticket metadata (tier, `**Files**`, Decision/Acceptance lines) read and understood.
- [ ] Own branch exists per `git-protocol.md`; zero edits made to any file yet.

## Constraints

- No code, doc, or config edits during bootstrap — this phase only observes and provisions.
- Never write the Status Board or any orchestrator-owned shared state (kernel §6).
- Never `git stash`; never start on main (`git-protocol.md`).
- A stale base, red base gate, or dirty shared tree is a STOP-and-flag with its distinct status
  ("stale base" / "environment not green"), not something to absorb into the ticket. Heal-then-
  re-verify is the only permitted self-repair, and only for the base (Phase 3.1c).
- Stay inside the kickoff's routing — do not self-expand scope or pull in unassigned tickets.

## Output

A ready worker: isolated branch on a verified base, deps installed, base-gate evidence captured,
ticket guardrails loaded. Hand off to `worker-execute`.
