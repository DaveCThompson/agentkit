---
name: mirror-contract
description: The contract between canonical .agent/ sources and generated vendor surfaces. Copy-based rewrite of a predecessor kit/specs/mirror-contract.md.
last-verified: 2026-07-03
---

# Mirror Contract (copy-based)

*Supersedes `a predecessor kit/specs/mirror-contract.md` (Apr 2026), which was junction-based and used
`.agents/` naming. Junctions are banned: cloud-synced flattens Windows junctions into silently-diverging
real copies — the root cause of the fleet's drift. Everything below is plain copied files.*

1. **One source.** `.agent/` (singular) in the kit repo is the only authored home for core assets.
   Per-project `.agent/` is a kit-shipped copy plus project overlay files.
2. **Vendor dirs are generated, never authored.** `.claude/ .agents/ .gemini/ .opencode/` contents
   that the lock tracks were emitted from the merged `.agent/` tree. A direct edit is drift.
   Adoption supports only an explicit, validated source and reversible transform; a body citation
   never selects its destination. Composite/lossy output must be reconciled at its canonical source.
3. **Provenance is structured.** Adapter outputs identify the exact canonical `source` and
   `transform` (`body-md`, `copy`, or `unsupported`). Body adoption preserves original canonical
   metadata; `copy` is lossless single-source content. Headers are helpful where the native format
   permits them, not ownership evidence. Output bytes are deterministic, without generation timestamps.
4. **The lockfile is the shipped-state record for consumer projects.** A committed
   `.agentkit.lock` maps every shipped file to its out-hash + source-hash + kit version. A lock
   entry means "sync wrote this"; absence means "project-owned". All drift verdicts derive from it:
   IN-SYNC / STALE / LOCALLY-EDITED / CONFLICT (+ NEW / ORPHAN / UNTRACKED-DIFFERS at the edges).
   A refused operation retains prior ownership; failure must not make edited content appear unmanaged.
   The distribution repository itself is the exception: its derived lock is local and regenerated
   during self-sync.
5. **Preflight the coherent effect set.** Validate config, sources, destinations, ownership, collisions,
   settings and removals before writes. Known conflicts stop the update. Recheck input identities
   before application. `--force` needs authority for the entire reviewed effect set; it cannot waive
   invalid paths, schema or ambiguous provenance. A historical merge base must match the recorded
   source hash; a version tag alone is insufficient. Missing evidence leaves reconciliation pending.
6. **Removal is symmetric to addition.** When an asset leaves a project's selection, sync prunes
   exactly the files it previously wrote, preserving edits as conflicts. Settings retirement uses
   typed exact contributions, separately for hooks, MCP and permission grants.
7. **Settings acquisition matters.** Only provably kit-introduced exact contributions may be retired
   automatically. Identical pre-existing values are borrowed and remain user-owned. Different
   unowned values conflict before writes; edited contributions are preserved. Legacy key membership
   or equality does not prove introduction. Unresolved migration stays explicit. Default/deny/trust
   policy and unrelated values remain project-owned. Check and dry-run must expose managed settings
   deltas as well as file deltas; an older file-only checker cannot prove settings agreement.
8. **No mtime, ever.** Staleness and recency come from the lock and git history; cloud-synced churns
   mtime (decisions 25/37).
9. **Why consumer projects commit generated vendor surfaces.** Three dependencies make committing
   them contractual, not incidental: (1) fresh-clone discovery without the CLI installed;
   (2) recovery of recorded coupled consumer state with a compatible CLI; (3) dirty-managed-path
   detection — the sync collision
   guard and TICKET-18 warning read git status on managed paths and go blind if those paths are
   ignored. Churn is managed by session-boundary syncs and the lock's `syncedAt` attribution.
   The distribution repository keeps derived mirrors local because `.agent/` is its public source
   and publishing a second generated copy would add noise without adding consumer state.

## Interruption and recovery

The accepted operation contract retains validated paths, exact preimages or absence, prepared
replacement bytes, source/config/adapter identities and the previous completed lock before mutation.
The private `.agentkit.pending.json` is one scoped recovery record, not a historical version cache.
Publishing the completed lock is sync's commit point; adoption publishes its compiled manifest last.
Pending state is incomplete and blocks ordinary
mutation until reconciled; check must not overwrite it through diagnostic bookkeeping.

Recovery compares actual targets to before/after hashes, including a crash after replacement but
before progress recording. An intervening edit stops recovery. Per-file replacement does not promise
cross-file atomicity, power-loss durability, hostile-filesystem safety or distributed coordination.
`agentkit recover <project>` finishes the retained operation. Inspect its help and retained state
first; use the kit root for adoption recovery. It is not a rollback command.

Consumer sync is read-only toward the kit. Self-generation and adoption own kit manifest publication.
Adoption preflights canonical content, package, changelog and manifest at the kit root; retry must
produce exactly one version/history change. Deferred adoption is a separate queue write. No
cross-repository transaction is implied; later consumer sync is a separate action.

Keep pending records and staging files private and Git-ignored. They may contain settings values.
Preserve useful recovery data and ignored evidence separately before rollback or authorized transfer;
do not commit or propagate an in-progress operation as portable project state. See
[migration checklist](migration-checklist.md) for binding, recovery and rollback boundaries.
