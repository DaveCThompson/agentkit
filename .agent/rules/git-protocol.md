---
trigger: always
domain: git
---

# Git Protocol for Agents

**Never use `git stash`**. Stash creates base-commit drift, silently reverts
unrelated tracked-file changes on pop, and corrupts the working tree when
the branch has diverged. Agents have no recovery mechanism for this — always
commit, branch, or flag the conflict instead.

## Rules

### 1. Always Start on a Fresh Branch

```
git checkout -b feat/agent-<name>-<short-descriptor>
```

Every agent session gets its own branch. Never work directly on `main`.

### 2. Never Use `git stash`

- Stashing to temporarily set aside work is forbidden.
- If you need to switch context: commit WIP (with a meaningful message
  prefixed `WIP:`) or create a new branch.
- Related hazard: a pre-commit hook that OOMs (e.g. lint-staged running type-aware
  `eslint --fix` on a large branch) can silently auto-revert and leave an ORPHAN BACKUP
  STASH — mechanism and the portable heap-bump fix live in `tech-node-gate.md` §1.

### 3. On Merge Conflict: Stop

If `git merge`, `git rebase`, or `git cherry-pick` produces a conflict:

1. **Do not** resolve it automatically with `--theirs` or `--ours`.
2. **Do not** use `git stash` to work around it.
3. **Stop** and report the conflict to the user with:
   - Which files conflicted
   - The two sides (what each branch changed)
   - The recommended resolution if you can determine it

### 4. Commit Before Merging

Always commit or explicitly discard local changes before running `git merge`
or `git rebase`. A dirty working tree causes spurious conflicts.

### 5. Push for Handoff

If another agent needs to build on your work, push your branch and note the
branch name in the handoff. Do not stash-pop across agent boundaries.

### 6. Concurrent Sessions Share Nothing

Several interactive sessions often share one working tree — the branch and
the staging area are shared, mutable state that another session can change
under you at any moment.

1. **One session per working tree.** If a second session must run
   concurrently, give it its own `git worktree`. Mandatory for long sessions
   in cloud-synced-synced repos — that is where these races actually occurred.
2. **Re-check immediately before ANY commit.** Run
   `git branch --show-current` (the tree may have moved under you) and scan
   `git status` for staged entries you did not stage.
3. **Always commit by pathspec:**

   ```
   git commit -m "..." -- <path1> <path2>
   ```

   This commits only the named paths and is immune to foreign staged entries
   regardless of the race. Never bare `git commit` or `git commit -am` in a
   tree another session may share. Stage by pathspec too (`git add -- <paths>`);
   never `git add -A` / `git add -u` in a shared tree — they sweep in another
   session's changes exactly like a bare commit.

   **Multi-line messages — never via command substitution or a heredoc.** A
   single-line message uses `-m "…"`. For a body, either repeat the flag
   (`git commit -m "subject" -m "body para" -- <paths>`) or write the message
   to a scratchpad file with the Write tool and pass it as a real path:

   ```
   git commit -F <scratchpad>/msg.txt -- <path1> <path2>
   ```

   Do **not** use `git commit -m "$(cat <<EOF … EOF)"`, `git commit -F - <<'EOF'`
   (stdin heredoc), or a PowerShell `@'…'@` here-string. Every one of these
   prompts on every commit: `$(…)` prompts unconditionally, and a heredoc /
   here-string body is a unique unmatchable segment that never re-matches a saved
   allow (`pattern-command-shape.md` §5). `-F <realfile>` is the prompt-free form.
4. **Wrong-branch repair is pointer-only.** If a commit landed on the wrong
   branch, fix it with `git branch -f <intended-branch> <sha>` — never
   reset or cherry-pick gymnastics in a live shared tree.
5. **Never edit another session's single-writer file.** The Status Board is
   written only by the orchestrator; a maintenance or review session that
   finds it wrong reports the discrepancy, it does not correct it. Two
   writers on a single-writer file is how the one trustworthy surface
   stops being trustworthy.
6. **Sync derived surfaces TO the board; never adjudicate from the
   maintenance seat.** Indexes, README rows, and ticket headers are
   derived — bring them into agreement with what the board records. A
   maintenance session must not decide what the program's state *is*; it
   has the narrowest view of the tree and the least context for that call.
7. **Re-read before every edit, and attribute every dirty file before
   staging.** In a shared tree HEAD can advance and files can be rewritten
   under you mid-session. A file you did not touch appearing dirty is
   another session's work — leave it, and never let it reach your pathspec.

### 7. Diverged Long-Lived Branches: Preview, Reconcile-by-Doc, Supersede

Before merging or pushing a long-lived integration branch onto a shared branch, do NOT
assume it is simply "ahead." A blind merge here is how duplicated or broken work reaches
a shared branch.

1. **Measure divergence, don't guess.** `git rev-list --left-right --count <upstream>...HEAD`
   plus `git merge-base <upstream> HEAD`. Non-zero on BOTH sides means the branches have
   DIVERGED (siblings), not ahead/behind: a plain push is impossible and the merge may be
   large. Stop and scope before acting.
2. **Check for a documented reconciliation plan first.** Long-lived branches often already
   carry a working doc (a release-train / integration / reconciliation ticket or board) that
   records which line is canonical and how to land it. Grep the repo's working docs before
   merging — the decision may already be made; do not re-derive it or act against it.
3. **Preview conflicts in memory — never merge-then-abort.** `git merge-tree --write-tree
   [--name-only] <upstream> HEAD` performs the merge in memory and lists conflicts (exit 1)
   WITHOUT touching the working tree. A real `git merge` you then `--abort` dirties a shared
   tree and can leave conflict markers behind.
4. **Duplicate-integration signature → supersede, not merge/cherry-pick.** When two lines
   built the same work by different paths, `git cherry <upstream> HEAD` shows every commit as
   unique `+` (no patch-id match) and the preview shows `add/add` conflicts on the same feature
   files. A content-merge AND a broad cherry-pick are both wrong here — they reconcile two
   hand-authored copies of one feature and risk shipping duplicated or broken logic. If one line
   is the confirmed superset: confirm nothing is unique to the other side
   (`git diff --name-status --diff-filter=D <other> HEAD`), then `git merge -s ours <other>` —
   it keeps HEAD's tree entirely, records the other line as a merge parent so history is
   preserved, and makes the push a clean fast-forward. NEVER force-push to discard the other
   line's commits.
