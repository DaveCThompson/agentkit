# Changelog

<!-- The single kit-wide CHANGELOG dialect. Canonical spec: governance/docs-standard.md §(b).
     Exemplar: the kit's selected CHANGELOG dialect.
     - The `# Changelog` H1 above is MANDATORY.
     - One entry per completed session/feature; newest on top, directly below this intro.
     - `### Verification` and the `KB consulted:` line are required blocks, not optional.
     - Never use placeholders like `...` inside a live entry.
     - Finalize fragment summaries into one titled entry with actual proof limits before consuming
       recoverable fragments. Worker proof does not imply the combined candidate passed.
     - Do not publish private evidence links from local fragments.

     ROLL RULE: use .agent/rules/pattern-docs-artifacts.md, Changelog, for the current thresholds.
     HARVEST applicable durable facts into docs/knowledge-base/ FIRST, then move
     the old entries to docs/archive/YYYY-MM/CHANGELOG-YYYY-MM.md with a dated banner, and leave the
     one-line archive pointer below. Rolling without harvesting is truth deletion. -->

<!-- Archive chain: (none yet) — when you roll, list the archive files here, newest first, e.g.
     Earlier entries: docs/archive/2026-06/CHANGELOG-2026-06.md → docs/archive/2026-05/CHANGELOG-2026-05.md -->

## [YYYY-MM-DD] — Short title

One to three sentences: what changed and why. Link the session log or working doc if there is one.

### Added
- **`path/or/name`** — what it is and why it was added (one line).

### Changed
- **`path/or/name`** — what changed and why.

### Fixed
- **`path/or/name`** — the bug and the fix.

### Removed
- **`path/or/name`** — what was removed and why.

### Verification
- `<actual applicable project command>` — observed result, counts and candidate identity.
- `<focused behavior or runtime check>` — evidence, scope and result.
- Unverified or pending: <check, owner and blocked transition, or "none">.

KB consulted: none   <!-- replace only with actual consulted documents in the declared KB -->
