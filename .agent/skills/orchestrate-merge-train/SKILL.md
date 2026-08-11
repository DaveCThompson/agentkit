---
name: orchestrate-merge-train
description: Sequentially land finished worker branches to main — re-scan real surfaces, merge one at a time, run focused proof between each, apply one broad gate to the final tree, stop on conflict, and push only proven state. Use when a parallel wave's branches are ready to integrate.
tier: core
---

# Orchestrate Merge Train

Land a wave's finished branches onto main **one car at a time**: order, merge, validate, push,
book-keep — then the next car against the new main. The invariant that names the skill: **main is
never red on the remote.** A branch that fails the gate stops the train locally; nothing is pushed
until the gate is green. All shared contracts (privileged-role gate, completion report, manifest,
single-writer Status Board, orchestrator lock) live in `pattern-agent-orchestration.md`.

## When to Use

- Workers have filed `worker-report` completion reports and their branches await integration.
- A partial train stopped (conflict, red gate) and is being resumed after resolution.

## When NOT to Use

- Wave not yet launched → `orchestrate-partition` then `orchestrate-kickoff`.
- You are a worker with an unfinished branch → finish and file `worker-report`; workers never
  integrate (kernel §1).
- A single branch from solo (non-wave) work → ordinary merge under `git-protocol.md`; the train's
  sequencing machinery is overhead for one branch.
- End-of-session cleanup with nothing to land → `implement-session-wrap-up` directly.

## Approach

### Phase 1: Privilege and lock (fail closed)

0. **First-run scaffold (fail loud).** Confirm `.agentkit.json` has an `orchestration` block per
   `pattern-agent-orchestration.md` §4. Missing → STOP and scaffold it (print the starter block for
   the user to paste and confirm) before landing anything — never silently assume it exists.
1. **Privileged-role gate:** only a staff-tier, push-capable role runs this skill (kernel §1,
   bound in the roster's `maxRole`). Not staff-tier or cannot push → stop; hand off.
2. Acquire the orchestrator lock: `node "<kit>" lock acquire .` (kernel §6 write-if-absent); refuse if held.
3. `git status --short` must be clean on the integration tree. Dirty → commit or flag per
   `git-protocol.md`. Never stash.

### Phase 2: Order the train

1. Collect the wave's completion reports (kernel §3). A branch without a report does not board —
   the report's verification and merge-notes fields are the boarding pass.
2. **Re-scan actual surfaces:** first `git fetch origin <mainBranch>`, then for each branch run
   `git diff --name-only` against the freshly fetched remote (`origin/<mainBranch>...branch`).
   **Fetch, then diff against `origin/<mainBranch>`; never trust the local ref** — a stale local
   `mainBranch` flips every finding from "on-main" to "branch-only", exactly as
   `worker-bootstrap`/`worker-report` guard against. The ticket's `**Files**` line is a hypothesis
   only (kernel §6) — new deps and unlisted shared modules appear here first. WHY: static prediction
   is exactly what the merge-time scan exists to catch.
3. **Re-check Reserves (E):** for any ticket with a `**Reserves**` field, verify that its claimed
   scarce value (migration number, port, funnel-stage slot) actually exists in the landed branch
   and does not collide with an already-landed sibling. A reserves collision that partition missed
   stops the train — same posture as file-surface collision:
   - Read the actual state (e.g. `grep` the migration directory for the claimed version number).
   - If the value is absent or conflict: STOP, report with exact values, files, and branches
     involved. Never merge a reserves collision silently (kernel §6 re-verification).
4. Order cars: `**Depends**` edges first, then ascending real-surface overlap with the branches
   behind them (file-path set intersection — a computed fact, not a judgment call). Log the order
   and the reason on the Status Board.
5. Surprise overlap between two re-scanned surfaces that partition called disjoint → note it in
   the order and expect a conflict there; do not silently reorder past a dependency edge.

### Phase 3: Land one car

1. Merge the branch into main locally (fast-forward or merge commit per project convention).
2. **On conflict: STOP.** Per `git-protocol.md` — never auto-resolve with `--ours`/`--theirs`,
   never stash around it. Report: which files, what each side changed, recommended resolution if
   determinable. The train halts until a human (or an explicitly authorized resolution session)
   clears the car.
3. **Deterministic merge-health check** even on "clean" merges: zero conflict markers in the tree
   (`git diff --check`, plus a grep for `<<<<<<<`). Marker found → treat as Phase 3.2.

### Phase 4: Focused proof BETWEEN (the graduated gate)

1. Run focused proof from `foundation-testing.md` §1 — the canonical tiers, not a bespoke validate
   command — scaled to the blast radius of the **re-scanned** surface: lint + typecheck always;
   focused tests when behavior/schema/routes changed; build when build-affecting. The broad validate
   belongs once to the final integrated tree, not once per car. Cross-package surfaces scale per `pattern-monorepo.md`
   (validate affected workspaces; escalate to the graph when a shared package changed).
2. The gate's **exit code** is the verdict — the TRUE exit code, per `foundation-testing.md`.
   Prefer the project's one-command gate form — for Node repos the `gate:*` convention
   (`npm run gate`) documented in `tech-node-gate.md` — the script process owns the true exit
   code, so there is no filter to mask it and no prompt-inducing compound (`pattern-command-shape.md`).
   If you run a raw runner instead, **never pipe the validate through `| tail` or `| grep`** (the
   pipeline returns the filter's 0 and masks the failure — a real incident pushed red commits exactly
   this way): redirect output to a file and check `$?` directly. Then assert BOTH the exit code and
   the runner's actual pass line (e.g. `N passed, 0 failed`) — never a bare number. A green is only green when **proven** green. Green → Phase 5. Red → the
   train stops here: do not push, do not start the next car. Diagnose; if the fix is not trivial
   and obvious, revert the local merge and send the ticket back to its worker with the failure
   attached. Never "fix it in the next car" — that is how red boards compound. And never override
   an accurate worker red-report on the strength of a possibly-masked gate: when the worker says
   red and your gate says green, suspect your pipeline before their report.
3. **A green machine gate is not `done` for a `needs-human-verify` ticket** (kernel §2/§6). Its
   report names a human-only Acceptance item (real device, staging, visual QA) the gate cannot cover.
   Land it if the code gate is green, but in Phase 6 hold its board row at `needs-human-verify` with
   the exact pending check — never let the green exit code silently mark it done. A human flips it.

### Phase 5: Push (external mutation)

This phase is deferred while more cars remain. After each focused-green car, continue through
Phase 6 to the next car; when the train is complete, Phase 6 step 4 returns here after the final
tree gate.

1. Push only after Phase 6 has run or cited the one broad gate for the final integration tree.
   Intermediate cars may be merged and focused-verified locally; if a project policy treats an
   intermediate push as its own final tree, it owns a broad gate for that exact tree.
2. Pushing main is an outward-facing mutation → `pattern-external-mutation.md`: confirm
   authorization (it does not carry over from the previous car), push only this integration
   branch to its remote, and record the real result (remote ref, commit SHA) — never a vague
   "pushed."
3. A failed or ambiguous push fails closed: verify actual remote state before any retry.

### Phase 6: Book-keep, then next car

1. Record each car's focused evidence on the Status Board. Keep the row at `reported` until the
   final-tree gate completes; then flip it to `merged` when fully green, or **`needs-human-verify`**
   (with the pending manual check named) when the report flagged a human-only Acceptance item — never
   `done` on focused proof alone (Phase 4.3). Orchestrator is the single writer (kernel §6); record
   commit SHA and the gate tier that ran.
2. Move the ticket file per the docs model: `docs/working/` → `docs/archive/` per
   `pattern-docs-artifacts.md`. Compose `implement-session-wrap-up` for the archival mechanics
   rather than reimplementing them. **No per-car CHANGELOG edit** — lanes wrote
   `changelog.d/<ticket-slug>.md` fragments (kernel §4); the changelog is assembled once at
   train close-out (step 4), never car by car.
3. Next car: return to Phase 3 **against the new main**. If a waiting branch has drifted,
   `git fetch origin <mainBranch>` first, then merge the freshly fetched `origin/<mainBranch>` into
   it (or rebase per project convention) — never trust the local ref; any conflict there is Phase 3.2
   — stop and report, never bulldoze.
4. Train complete — **assemble the changelog from fragments (kernel §4)**: after the last car
   lands focused-green, run `agentkit changelog-roll --version <ver>` to roll every fragment under
   `changelog.d/` into one dated `CHANGELOG.md` section and commit the roll **plus the fragment
   deletions as a SINGLE final commit**. Then run or cite the one broad gate on this exact final
   integration SHA/tree. WHY: per-lane prepends to one file guarantee a multi-lane merge conflict;
   per-file fragments plus one assembly commit remove it. Then release the orchestrator lock
   (`node "<kit>" lock release .`) and run `implement-session-wrap-up` for the wave-level close-out
   (distillation, final board state).

## Verification / Definition of Done

- [ ] Privileged-role gate checked before anything moved; lock held for the full train.
- [ ] Every landed branch had a `worker-report` completion report and a merge-time
      `git diff --name-only` re-scan logged.
- [ ] Focused proof from `foundation-testing.md` ran between every land, and exactly one broad
      final-tree gate ran or was cited for the final integration SHA/tree — exact commands and real
      results recorded, never "all green" on unrun commands.
- [ ] Every gate verdict read from the TRUE exit code (no `| tail`/`| grep` masking) AND the
      runner's pass line; no worker red-report was overridden by a possibly-masked gate.
- [ ] CHANGELOG assembled once from `changelog.d/` fragments via `agentkit changelog-roll` in a
      single final commit (fragments deleted in the same commit); zero per-car CHANGELOG edits.
- [ ] Zero pushes with red or unrun required evidence; zero conflicts auto-resolved; every stop reported with
      files + both sides.
- [ ] Each push logged with remote ref + SHA (external-mutation audit trail).
- [ ] Status Board rows flipped by the orchestrator only; landed tickets archived; lock released.

## Constraints

- Never push a red or unvalidated board — no exceptions, including "docs-only" cars (they still
  run focused proof, and the final tree still gets one broad gate).
- Never resolve conflicts with `--ours`/`--theirs`, never `git stash`, never rewrite pushed
  history (`git-protocol.md`).
- Never invent a `validateCommand` — the gate is `foundation-testing.md` §1, scaled, always
  (kernel §4).
- Sequential by design: one car merging at a time. Parallel integration reintroduces the races
  the wave machinery exists to remove.
- Harness-neutral: the whole train is plain git + the project's gate commands. CI/merge-queue
  automation is an accelerator only; the local validate-between still runs.

## Output

- Main advanced by N landed, individually validated merges; remote never red.
- Status Board showing per-ticket landed state with SHAs and gate evidence.
- Archived tickets, one rolled changelog section (assembled from `changelog.d/` fragments in a
  single close-out commit), and a stop report (files + sides + recommendation) for any car that
  halted the train.
