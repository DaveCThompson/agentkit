---
trigger: always
domain: git
---

# Git Protocol for Agents

Preserve owned and concurrent work. Git refs, the index and the working tree are shared mutable
state; scope alone does not isolate independent committers. Never use `git stash` as coordination.

## 1. Branch and base ownership

The integration owner establishes the requested branch/base before editing. Use a fresh task branch
when branch creation is in scope; honor an explicitly selected branch or checkout. Workers in a
shared-tree-disjoint run do not create/switch branches. Independent committers use separate worktrees.

Resolve the chosen base and confirm it contains the intended prerequisites. New paths can legitimately
be absent; verify their intended parent/creation scope. On mismatch, preserve state and coordinate
recovery. Zero local commits does not justify `reset --hard` or dropping untracked/ignored files.

## 2. No stash-based handoffs

Do not stash/pop to move work between tasks. Use owned commits when authorized, or explicit preserved
local artifacts. A pushed branch carries tracked commits, not ignored tickets, evidence or notes;
deliver those through an authorized accessible channel and verify recipient access.

## 3. Conflict handling

On merge/rebase/cherry-pick conflict, stop the operation's progression and report affected files,
both intended behaviors and a recommended resolution. Do not automatically choose `--ours` or
`--theirs`, reset, or discard state. Resolve only with the applicable explicit authority.
Do not run order-dependent Git operations concurrently.

## 4. Commit and integration preconditions

Before commit, verify branch, HEAD, index, intended diff and ownership of every named path.
Stage/commit by explicit pathspec; a pathspec does not protect foreign changes within the same file,
so resolve mixed ownership first. Avoid sweeping add/commit commands in shared trees.
Use normal `git commit -m` arguments or a real message file, not command substitution.

Before merge/rebase, checkpoint owned work and account for all other local state. Never discard
changes merely to obtain a clean status. Prefer an in-memory merge preview when available.
The accepted output is an immutable commit/content identity; refresh review/proof if its tip changes.

## 5. Publication and handoff

Commit, merge, push and remote publication are separate authorities. Push only when the user's
grant covers the exact repository/ref and action, per `pattern-external-mutation.md`.
A local handoff can be complete without publication if the recipient can access the accepted output.
When publishing, confirm the remote result. An uncertain push requires reconciliation before retry.

## 6. Concurrent sessions

- One coordinator owns a shared tree's Git, generation, shared metadata and final proof.
  Parallel authors are allowed only with explicit disjoint write sets and attributed changes.
  Use isolated worktrees for independent Git writers or incompatible environments.
- Re-read before edits and before staging; another writer may have changed the same path.
  Stop and coordinate overlapping ownership rather than absorbing a foreign diff.
- Ticket frontmatter owns work status. Boards own scheduling and derive status; maintenance
  cannot decide a ticket is complete from a board summary or an ancestor citation.
- Freeze writers for a combined verification snapshot. Shared-tree tests cover the combined
  content, not an individual author's diff unless the fixture truly isolates it.
- Only the resource owner cleans worktrees/branches after checking inactivity, unique commits,
  all useful local files and required evidence. Retain ambiguous or active resources.

## 7. Diverged or resumed work

Measure divergence and inspect current instructions, accepted outputs and remaining requirements.
Do not rebuild already accepted work from a stale base. Preserve partial progress and its active
attempt identity; stop the old writer before assigning the same surface to a resumed attempt.

A patch-ID comparison, deleted-path list or clean merge cannot establish semantic equivalence.
If two branches independently implement the same feature, reconcile unique behavior and history
before selecting integration strategy. Superseding a branch or making an ancestry-only merge requires
explicit agreement on the retained result; never infer it from a textual similarity heuristic.
Do not force-push or move shared refs to hide divergence.
