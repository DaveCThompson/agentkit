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
- **Coordinator** — assemble one entry below the existing changelog intro and archive pointer.
  Inspect the installed `agentkit changelog-roll --help` before invoking its supported assembly
  path. Finalize the title, summary, Verification and `KB consulted:` blocks; preserve existing
  history. Consume fragments only after the final entry is checked and exact recovery is established.
  The titled invocation is `agentkit changelog-roll . --title "Describe the delivered outcome"`.
  Without a title, retain fragments or refuse; do not consume their only copy. Verify the actual
  result. The caller owns proof and final prose; the command is not a semantic validator.
  The command retains all fragments. Any later removal is a separate scoped action after verified
  recovery and finalization. It does not commit, harvest durable facts or enforce archive retention. This README
  is excluded from assembly and retained.

A fragment contains a proposed short title/summary, applicable change bullets, actual verification
with relevant source identity and limits, pending checks with owners/transitions, and `KB consulted:`.
The coordinator reconciles these scopes; concatenated worker greens do not prove the combined tree.
Use the project's existing private evidence store for recoverable fragments and redact private links
from public release notes. A coordinator-authored entry needs no fragments.
