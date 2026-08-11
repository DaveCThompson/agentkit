# changelog.d/ — conflict-free changelog fragments

Repo-root staging dir, sibling of `CHANGELOG.md`. Exists so a **parallel wave** of agents can each
record their changelog entry without colliding on one file.

## Why this dir exists (R13)
A wave where every lane prepends a dated section to a single `CHANGELOG.md` guarantees a merge
conflict on that file — often the *only* one. Instead, each lane drops its own fragment here, so no
two lanes ever touch the same file.

## How to use it
- **Workers** — write your entry to `changelog.d/<ticket-slug>.md` (e.g. `changelog.d/TICKET-21.md`).
  One file per lane → no collision. Never edit `CHANGELOG.md` directly.
- **Merge-train** — after the wave lands, run `agentkit changelog-roll` from the repo root. It
  assembles every `*.md` fragment here into one dated section at the top of `CHANGELOG.md` (newest
  first — see `.agent/rules/pattern-docs-artifacts.md`) in a single commit, then **deletes the
  fragments**. This `README.md` is excluded by name and is never rolled or removed.

A fragment is just the entry body (the `### Added / Changed / Fixed / Removed` bullets); the roller
supplies the dated `## [YYYY-MM-DD]` heading. Keep fragments to what/why one-liners per the CHANGELOG
dialect in `governance/docs-standard.md` §(b).
