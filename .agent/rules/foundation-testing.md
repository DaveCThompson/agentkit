---
trigger: always
domain: testing
---

# Testing & Verification

Always attach truthful evidence to implementation, integration, and release claims. Verification is
lifecycle-aware: a local change needs focused proof, an integrated final tree gets one broad gate, and
a release gets release validation. Do not repeat a broader gate merely because a workflow reached a
new wording of "done".

## 1. Lifecycle-Aware Verification Gate
**The canonical gate. Skills reference this section; do not restate it elsewhere.** Scale
verification to blast radius — the tiers are the contract; adapt to the project's
lint/typecheck/test/build equivalents, never assume one stack's scripts.

| Lifecycle point | Required evidence |
| :--- | :--- |
| **Focused local proof** | Every change: `lint` + `typecheck`; behavior/schema/route changes: focused tests; SSR/routing/build-affecting changes: `build`. |
| **Final tree** | Run the project's broad validate once on the final standalone or integrated tree: lint + typecheck + tests + build, as applicable. A worker branch normally supplies focused proof; the integration owner supplies this final-tree gate. |
| **Release boundary** | Run the project's release validation once at the release boundary. It includes the broad final-tree gate plus packaging/deploy, target-environment, migration, and required human checks as applicable. See `verify-pre-deploy.md`. |

Focused proof supports a worker `reported` or implementation-progress claim when the report names
the final-tree gate owner and marks it pending. A `merged`/`released` claim needs the corresponding
final-tree or release evidence. A human-owned lane remains `needs-human-verify` until that lane is
closed.

### 1A. Evidence identity and cite-or-run
Evidence is reusable only when it identifies the exact state it covers: prefer a commit SHA; for an
uncommitted tree record its tree identity (for example, `git write-tree`), plus the lane, exact
command, true exit code, and the runner's real pass line. Local and CI evidence are equivalent when
they cover the exact final SHA/tree and the required lane. Otherwise run the missing proof.

Use `agentkit receipt` to record this evidence mechanically when practical. `agentkit receipt
--check` must pass before citing a receipt on a later lifecycle boundary; a stale receipt is missing
evidence, not a warning.

- **Run each gate as a single command, not a compound pipeline.** Run a tier — or the whole gate — as
  a single, prefix-matchable command. This is the permission-friendly form (`pattern-command-shape.md`):
  a bespoke `cd … && <runner> … > log 2>&1; echo EXIT=$?; grep … | tail` compound is unique every run,
  so it prompts every run and never re-matches a saved allow. It **also** kills the pipe-masking
  trap below for free — the script process owns the true exit code, so there is no `| tail` between
  the runner and the verdict and no `set -o pipefail` / `${PIPESTATUS[0]}` segment to defeat
  matching. A project without a one-command gate convention should add one; the app-repo `gate:*`
  npm-script convention lives in `tech-node-gate.md` — until an equivalent exists, adapt the tier
  command names but keep the one-command shape.
- **Bug fixes: failing repro test FIRST.** Write the test that reproduces the bug, watch it fail,
  then fix and watch it go green. A fix without a failed-then-green test proves nothing.
- **Never claim green on unrun commands.** Name the lifecycle point and evidence actually covered.
  Focused local validation is not the broad final-tree or release gate — say which ran. Local
  validation is not staging or live-data verification.
- **Read the TRUE exit code — never let a pipe mask it.** `cmd | tail` / `| grep` / `| head` returns
  the *filter's* exit status (0), not `cmd`'s — so a failing validate reads "green" and a real defect
  ships. A green must be *proven*: use `set -o pipefail` or `${PIPESTATUS[0]}`, or redirect the run to
  a file and read the exit code **and** the runner's actual "tests passed / build clean" pass line —
  assert on that line, never a bare printed number. A filtered-away failure is an unrun-green claim.
  (Live incident: a `| tail`-masked gate pushed red commits and made the orchestrator override two
  workers who were both correct.)

#### 1B. Cite-or-Run
Any commit SHA, file path, or test count written into code, comments, or docs MUST be verified first
(`git log`/`ls`/the runner's real pass line). An unverified citation is a defect — a SHA that was
never checked is indistinguishable from a fabricated one, and a file path that was never confirmed
to exist is a narrative claim, not evidence.

**Coverage / breadth claims count too.** Any completion claim of the form "X now backs all N
routes/pages/consumers" (an engine, hook, schema, or component that supposedly covers a whole set)
MUST be proven by grepping the importers, not asserted from intent — one un-migrated consumer makes
it false. A false "backs all four routes" claim that reaches a ticket or changelog propagates the
drift downstream, so the cheap grep is mandatory before the claim is recorded. (Live incident: a
"engine backs all four AI routes" claim was false for the streaming route and had already reached a
ticket + changelog before a grep caught it.)

#### 1C. Red-Proof (Sabotage Proof)
To *claim a gate works*, trip it — paste the failing output, then the passing output. Asserting a
gate is green is not evidence it can go red. A gate that was never seen to fail is an unverified
claim. This applies to any eval axis, threshold, or fixture expectation the worker wrote or modified.

## 2. Refactor Verification (behavior-preserving)
1. Run the gate (§1) at the behavior-change tier even though the intent is "no behavior change" —
   the touched domain's tests are the proof of preservation.
2. If a refactor changes a visible interaction contract, update stale tests to assert the new real
   contract — do not preserve obsolete internal-text assertions.
3. Do not call a refactor "green" unless the commands actually ran in the current branch state.

## 3. Documentation Truthfulness
- Tickets and logs must list the exact commands actually run.
- Do not cite nonexistent test files or vague claims like "100% pass" without naming the suite.

## 4. No New Errors
Do not introduce new lint/type errors. If an existing error is discovered, note it but stay focused
on the current task — unless it blocks truthful validation, in which case fix it first.
If lint or build fails: parse the error, fix, re-run. Escalate to the user after 3 attempts.

## 5. Know Where Tests Are Collected
Test runners only collect files matching their configured `include` globs. A test placed outside
those globs silently **never runs** — a false sense of coverage. Before adding a test, confirm the
runner will actually collect it, and confirm the environment (node vs jsdom) the file needs.

## 6. Prefer Testing Pure Functions
Extract a hook's or component's decision/math logic into a sibling pure module and unit-test that
directly; leave only orchestration (timers, subscriptions, DOM/pointer events) in the hook, covered
by manual QA. This keeps tests fast, deterministic, and independent of a DOM test harness.

## 7. Determinism & Mock Quality
- **Time:** Anchor time-dependent logic to a fixed baseline date and use fake timers
  (`setSystemTime`) so fixtures and the runner share one clock — prevents bucketing drift.
- **Mocks:** Align mocks/fixtures with the production schemas; use `Partial<T>` helpers so a test
  specifies only the fields it cares about. Update centralized fixtures first when a schema changes.
- **E2E:** Never hardcode credentials (use env vars with a safe local default); inject deterministic
  state via init scripts rather than driving real auth. (Framework-specific typing/API detail lives
  in `tech-node-gate.md`.)
