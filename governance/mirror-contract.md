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
   that the lock tracks were emitted by `agentkit sync` from the merged `.agent/` tree. Editing them
   directly is drift — supported (check detects it, adopt flows it back), but never silent.
3. **Every generated text file carries a header** naming its source and the resync command.
   Deterministic content only — no timestamps — so sync stays idempotent.
4. **The lockfile is the shipped-state record.** `.agentkit.lock` (committed) maps every shipped
   file to its out-hash + source-hash + kit version. A lock entry means "sync wrote this"; absence
   means "project-owned". All drift verdicts derive from it: IN-SYNC / STALE / LOCALLY-EDITED /
   CONFLICT (+ NEW / ORPHAN / UNTRACKED-DIFFERS at the edges). A REFUSED PRUNE stays lock-recorded
   (`refusedPrune: true`) until actually pruned or adopted; "absence from the lock means
   project-owned" holds only because refusals never leave the lock.
5. **Nothing is silently clobbered.** Sync refuses to overwrite content whose hash differs from the
   lock's shipped hash without `--force`, and prints the 3-way base (kit git history at the lock's
   kit version tag). Adopt applies the same guard in reverse.
6. **Removal is symmetric to addition.** When an asset leaves a project's selection, sync prunes
   exactly the files it previously wrote (lock-verified, refuse-if-edited), and settings key-merges
   are reversed via the lock's managed-key record.
7. **Settings files are shared ground.** Sync owns exactly two concerns in vendor settings — hook
   registrations and MCP server config — via key-level merge (JSON) or a delimited managed block
   (TOML). Everything else in those files is project-owned and never touched.
8. **No mtime, ever.** Staleness and recency come from the lock and git history; cloud-synced churns
   mtime (decisions 25/37).
9. **Why generated vendor surfaces are committed.** Three dependencies make committing them
   contractual, not incidental: (1) fresh-clone runtime discovery — an agent session must find its
   rules/skills without the CLI installed; (2) the revert guarantee (decision 36) — every sync must
   be trivially revertible via git; (3) dirty-managed-path detection — the sync collision guard and
   TICKET-18 warning read git status on managed paths and go blind if those paths are ignored.
   Churn is managed by session-boundary syncs and the lock's `syncedAt` attribution — not by
   gitignoring the contract away.
