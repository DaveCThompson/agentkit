---
name: worker-report
description: Close out a parallel worker — commit to the worker branch, run focused proof at the worker boundary, and emit the kernel completion report as the handoff. Never merges to main, never touches the Status Board. Use when a worker ticket is finished or blocked.
tier: core
---

# Worker Report

The worker's close-out: focused proof, commit, and the structured completion report that makes
"point me at the branch" safe for the orchestrator. The report contract is kernel
`pattern-agent-orchestration.md` §3 — this skill produces it; it does not restate it. WHY the hard
boundary: integration (merge-train, Status Board, changelog on main) is the orchestrator's
privileged role (kernel §1, §6). A worker that merges or edits shared state reintroduces exactly
the write race the single-writer rule removed. The report *is* the handoff.

## When to Use

- `worker-execute` exited: Acceptance satisfied, or a blocking flag was raised (blocked tickets
  still close with a truthful report).
- The orchestrator asks for an interim status in report form.

## When NOT to Use

- Acceptance items still open and unblocked → back to `worker-execute`.
- Environment broke mid-work (base moved, deps invalid) → `worker-bootstrap` to re-verify first.
- You are the orchestrator consuming reports / merging / updating the board → the `orchestrate-*`
  skills.
- Solo session end with changelog + archival duties → `implement-session-wrap-up` directly; this
  skill deliberately withholds the shared-state steps a solo wrap-up performs.

## Approach

### Phase 1: Focused proof — the worker lane
1. Run the lifecycle-appropriate **focused local proof** (`foundation-testing.md` §1) scaled to
   the ticket's blast radius: `lint` + `typecheck` + the touched domain's tests + `build` as
   applicable. Prefer the project's one-command gate form — a single allowlisted command that owns
   its own exit code (`foundation-testing.md` §1, `pattern-command-shape.md`); for Node repos
   that's the `gate:*` convention (for example `npm run gate:test`) documented in
   `tech-node-gate.md`. The broad gate belongs once to the final standalone/integrated tree; do
   not rerun it on every worker branch. If this worker owns the final standalone tree, run or cite
   that one broad gate here.
2. **Read the TRUE exit code — never a filter's.** The one-command gate (`gate:*` on Node repos)
   already owns the true exit code; if you must run a raw runner instead, NEVER pipe it through
   `| tail`, `| grep`, or `| head`
   (the pipeline's exit code is the filter's 0, masking a real failure as green) — redirect to a
   file and inspect it. Assert on BOTH the exit code AND the runner's actual pass line ("N passed",
   "build clean") — never a bare printed number. A filtered-away failure is an unrun-green claim in
   `foundation-testing.md` terms; the merge-train trusts this gate, so masking it poisons the wave.
3. Record EXACT commands, real results (test counts, exit codes), the verification lane, and the
   exact commit SHA/tree identity covered. "All green" with nothing behind it is a defect, not a
   summary. CI evidence is valid when it covers this exact SHA/tree.
4. Gate red? Fix within scope, or close as **blocked** with the failure output in the report.
   Never report done on a red or unrun gate.
5. **"Pre-existing / unrelated / same on main" is REJECTED by default — prove it, don't assert
   it.** To claim a failure isn't yours: check out `origin/<mainBranch>` (or your recorded base),
   run the IDENTICAL command, and attach BOTH outputs to the report. No proof pair → the failure
   is treated as yours. WHY symmetric: a worker's word is never sufficient — unverified
   verification is distrusted from every role, including your own green.
6. **Machine gate green but an Acceptance item is human-only?** (real device, staging, visual QA the
   gate cannot exercise.) Do NOT report done — set report `status: needs-human-verify` (kernel §2) and
   name the exact manual check a human must run. The gate passing as far as it can is necessary but not
   sufficient; claiming done here is the same defect as an unrun-green claim.

### Phase 2: Commit and publish the branch
1. Commit everything to the worker's own branch; `git status --short` MUST be empty after — an
   uncommitted file is work the orchestrator can't see.
2. Capture `branch` name and `commit` SHA (`git rev-parse HEAD`).
3. Push the branch for handoff per `git-protocol.md` §5. A push is an external mutation — follow
   the kernel §7 confirm-before-outward-effect discipline where the runtime gates it.
4. Never merge into `mainBranch`, never rebase onto a moved main on your own initiative — merge
   order and conflict resolution belong to the merge-train (staff-tier, kernel §1).

### Phase 3: Measure the real surface — hard-fail on out-of-surface edits
1. `git diff --name-only <base>..HEAD` — the *actual* touched surface. The ticket's `**Files**`
   globs were a hypothesis; this is the fact the orchestrator re-verifies at merge (kernel §6).
2. Intersect the diff against the ticket's `**Files**` globs. **Any path outside the declared
   globs is a HARD FAIL that blocks `reported`** — unless each out-of-surface path is individually
   justified in the report. A blanket "it was needed" is not a justification; the report must state
   the path, why it was needed, and why it doesn't introduce a collision nobody checked for.
3. For gate-touching tickets (edits an eval axis, threshold, or fixture expectation): **refuse
   `reported` without pasted red-proof output** (see `foundation-testing.md` §1 — red-proof: trip
   the gate, paste the failing output, then the passing output). A green-only assertion proves
   nothing.
4. **Deletions and renames — report them, never omit them.**
   `git diff --name-status --diff-filter=DR <base>..HEAD`, plus any exported symbol, route, script,
   or dependency the branch removes. **Zero deletions is an explicit value in the report, not an
   absent field** — an omitted field reads as "nothing to see" and is exactly how a retired icon
   system survived inside an agent rule. You do not perform the docs sweep (that is the session's
   job at wrap-up / land, `implement-session-land` §2.0); you hand the orchestrator the list it
   needs to run it.
5. Note merge-relevant facts while they're cheap to see: shared/high-traffic files touched, new
   dependencies added, whether main has moved since your base (`git log --oneline <base>..origin/<mainBranch>` non-empty ⇒ rebase likely).

### Phase 4: Emit the kernel §3 completion report
Fill every field — a missing field is a hole the orchestrator must re-derive:
- **ticket id**
- **branch + commit**
- **status** — `reported` (gate green, no human check pending) · `blocked` (gate red / wall hit) ·
  `needs-human-verify` (green as far as the machine goes, human-only Acceptance item pending). This is
  what tells the merge-train whether a green gate means done (kernel §2/§3).
- **what shipped** — behavior delta, not a file list.
- **deviations from plan (+ why)** — the deviation ledger from `worker-execute`, plus any
  out-of-surface paths from Phase 3. Empty is a valid, explicit entry ("none").
- **verification** — focused or broad gate tier that ran, exact commands, real results/test counts
  (Phase 1), exact SHA/tree identity, and the base-gate contrast from `worker-bootstrap` when it
  clarifies blame. Any "pre-existing"
  claim carries its Phase 1 proof pair (main output + branch output); without it the claim does
  not go in the report.
- **Runtime assumptions** — every library/runtime behavior the code relies on but the gate did not
  execute (rendering, browser APIs, network). Typecheck+lint green ≠ runtime behavior; this line is
  the map for the runtime or human lane when the machine gate cannot execute it (kernel §3).
  If nothing unexecuted was relied on, state "none" explicitly — the report is incomplete without
  this line.
- **Verification lanes** — for each core lane (`machine`, `runtime`, `human`, `docs`, `landing`),
  name the owner, status (`complete`, `pending`, or `not applicable`), and exact evidence or
  pending check. Project profiles may add project-owned lanes; do not invent core fields for them.
- **producer** — the tier this worker actually ran at + the model id, copied from the kickoff
  block. Any learning or pattern candidate listed in this report inherits this provenance — it is
  what the kernel §1 codification gate reads before anything you observed can become a rule.
- **collision surfaces touched** — shared files, config, cross-package edits.
- **merge notes** — rebase needed? conflicts expected where? suggested merge order relative to
  `**Conflicts-with**` tickets.
- **Gate-shaping disclosure:** "List any change you made in order to make a failing check pass,
  and why the check (not the code) was wrong." If no such change was made, explicitly state "none."
  The report is incomplete without this line.
**Cite-or-run applies to every SHA, file path, and test count in the report** — an unverified
citation is a defect. Every SHA must be confirmed via `git log`; every file path via `ls` or
`git show`; every test count from the runner's actual pass line, never a printed number alone.
Write it with `handoff` discipline: junior-dev-safe, no jargon left unexplained, truthful
verification only. Durable-fact distillation follows `implement-session-wrap-up` Phase 2 routing —
but as *candidates listed in the report* (KB/changelog entries for the orchestrator to land), not
as edits to shared docs from the worker branch.

### Phase 5: Deliver and stand down
Deliver the report through your reply channel to the orchestrator. Do not edit the Status Board,
`CHANGELOG.md`, or the queue docs — one writer (kernel §6), and N workers editing the changelog on
N branches is a guaranteed merge conflict. Remain available for orchestrator follow-ups (rebase
request, conflict questions); make no further edits unless re-tasked.

## Verification / Definition of Done

- [ ] Focused proof ran on the final worker branch state; exact commands + real results + SHA/tree
      identity are in the report (`foundation-testing.md` — no unrun-green claims).
- [ ] The report names the owner of the one broad final-tree gate, or cites it when the worker owns
      the final standalone tree; no repeated broad gate is implied.
- [ ] Gate result read from the true exit code — no `| tail`/`| grep`/`| head` between the
      validate and the assertion — and matched against the runner's own pass line.
- [ ] Every "pre-existing / same on main" claim is backed by the identical command run on
      `origin/<mainBranch>` with both outputs attached; unproven claims were dropped or the
      failure owned.
- [ ] `git status --short` empty; branch pushed; commit SHA recorded in the report.
- [ ] Deletions/renames enumerated via `git diff --name-status --diff-filter=DR <base>..HEAD` and
      stated in the report — **zero is written as zero**, never left absent.
- [ ] Actual surface measured via `git diff --name-only <base>..HEAD` and intersected against the
      ticket's `**Files**` globs; **every out-of-surface path is a hard fail that blocks
      `reported`** unless individually justified in the report.
- [ ] For gate-touching tickets (edits an eval axis, threshold, or fixture): **refused `reported`
      without pasted red-proof output** — trip it, paste failing then passing.
- [ ] Every SHA, file path, and test count in the report is cite-or-run verified — an unverified
      citation is a defect.
- [ ] All kernel §3 fields present (including `producer`, **Runtime assumptions**, **Verification
      lanes**, and gate-shaping disclosure) — none blank, none "N/A" without a reason. An empty Runtime-assumptions field is
      an explicit "none", never an omission.
- [ ] Zero writes to the Status Board, changelog, or any orchestrator-owned doc.
- [ ] No merge, rebase-onto-main, or tag was performed by this worker.

## Constraints

- **NEVER merge to main. NEVER edit the Status Board** (kernel §6) — the report is the handoff;
  integration is the orchestrator's job.
- Never `git stash`; on unexpected conflict state, stop and report per `git-protocol.md` §3.
- A blocked ticket gets the same full report with status "blocked" — silence is the only wrong
  close-out.
- Report only what ran: local validation is not staging verification — say which it was.

## Output

The kernel §3 completion report, delivered to the orchestrator, backed by a pushed branch at a
recorded commit with a green (or truthfully-red, blocked) gate.
