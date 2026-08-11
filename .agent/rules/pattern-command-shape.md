---
trigger: always
description: Compose shell commands so the permission engine can match them — one command per call, no cd prefix, dedicated tools over shell utilities, no inline loops or command substitution. Consult before any Bash/PowerShell call.
domain: tooling
---

# Command Shape (permission-friendly shells)

The permission engine splits a compound command on `&&` / `;` / pipes and requires **every**
segment to match an allow rule. One unmatchable segment prompts the whole command — so the
allowlist being complete for a command's *head* is not enough. Most agent prompts are caused by
command **shape**, not missing rules: a saved "always allow" of a compound one-liner is a dead
fossil that never matches again once one token changes. Shape the command so it matches. This rule
is always active.

## 1. One logical command per call
Issue independent steps as **separate** tool calls, not `a && b; c`. The Bash tool's working
directory and environment persist between calls, so nothing is lost by splitting. A compound is
acceptable only when the steps are genuinely dependent AND every segment is independently
allowlistable (e.g. `git add -- <path> && git commit -F <file> -- <path>`).

## 2. Never prefix `cd`
The tool's cwd persists; a leading `cd "…" &&` adds an unmatchable segment for nothing. Pass a
path to the command instead (`git -C <dir> …`, `npm --prefix <dir> …`), or rely on the persisted
cwd. (Observed: 63% of prompted calls carried a dead `cd` prefix.)

## 3. Dedicated tools over shell utilities
Read / Grep / Glob / Edit / Write **never** prompt. `cat` / `grep` / `sed` / `find` — and
especially in-place `sed -i` or a `for … done` file loop — inside a Bash call **do**. Reach for
the tool:
- Reading files → **Read** (not `cat`, not `head`/`tail` on a source file).
- Searching content → **Grep**; finding paths → **Glob** (not `find` / `grep -r`).
- Editing a file → **Edit** / **Write** (not `sed -i`, not a PowerShell `Set-Content` script).

## 4. No inline `for` / `while` loops
A loop construct is unsplittable and unmatchable. Unroll a small loop into N separate simple calls,
or when the iteration is real, run a `node` script (`node *` is allowlisted) instead of a shell
loop. Same for PowerShell `foreach` / `$var = …; … | ForEach-Object` pipelines — prefer the
PowerShell tool with simple statements, or a `node` script.

## 5. No command substitution `$(…)` (nor here-strings for messages)
Claude Code prompts on **any** command containing `$(…)`, regardless of the base command, because
substitution can hide arbitrary execution — no allowlist can rescue it. If you need a value, capture
it in a prior call and use the literal, or use a tool. Likewise a multi-line message delivered via
`$(cat <<EOF)`, a `<<'EOF'` heredoc, or a PowerShell `@'…'@` here-string is unique every time and
never re-matches — see `git-protocol.md` §6.3 for the commit-message form.

## 6. Redirect-and-check, not pipe-and-parse
When you must capture output, redirect to a file and inspect it with the Read tool — do not build a
`… | grep … | tail` pipeline (the pipe defeats matching *and* masks the true exit code, per
`foundation-testing.md` §1). For verification gates specifically, run the project's one-command gate
(`foundation-testing.md` §1); for Node repos that's the `gate:*` npm-script convention documented in
`tech-node-gate.md`. Either way it collapses the whole gate to one allowlisted command that owns its
own exit code.

## What still (correctly) prompts — do not try to shape around these
Outward-facing or destructive effects are gated by design (`pattern-external-mutation.md`): external
`curl`/network fetch, `git push` / `git push --delete`, broad `rm`, process kills
(`Stop-Process -Force`), and `powershell -NoProfile -Command "<arbitrary string>"`. The fix for a
recurring one of these is a named, narrowly-scoped helper script (invoked via the allowlisted
`node *`), not a broader allow rule.
