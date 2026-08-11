# changelog.d/ — conflict-free changelog fragments (R13)

Parallel lanes each drop **one fragment file** here — `changelog.d/<ticket-slug>.md` — containing that
lane's changelog bullet(s). Because every lane writes a *different* file, there is **no merge conflict**
on `CHANGELOG.md` (the one file every lane would otherwise prepend to, and the sole conflict in a
multi-lane merge train).

## Fragment format
A fragment is just the markdown body that would have gone under a changelog heading:

```md
- **Short title** — what changed and why (the same bullet you'd write in CHANGELOG.md).
```

## Rolling up
The **orchestrator's merge-train** (never a worker) assembles the fragments into one dated section at
the end of a wave, in a single commit, and deletes them:

```
agentkit changelog-roll --version v0.6.0     # or omit --version for a bare dated section
```

- Fragments are assembled in sorted filename order into `## [<date>] — <version>` at the top of
  `CHANGELOG.md`, then removed.
- Workers still never touch `CHANGELOG.md` directly (kernel §3) — they write a fragment here.
- This `README.md` is ignored by `changelog-roll`; only `<slug>.md` fragments are rolled.

See `.agent/rules/pattern-agent-orchestration.md` §4.
