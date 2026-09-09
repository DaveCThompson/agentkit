---
name: kit-contribute
description: Judge and route local agent-system changes at session end — flow improvements back to the kit, promote project-specific content to overlay, codify new patterns into rules, or discard noise. Use at wrap-up, or whenever check reports LOCALLY-EDITED core files.
tier: core
triggers: [wrap-up, flowback, contribute, codify, locally-edited]
conflicts-with: [pattern-codify]
required-tools: [agentkit]
---

# Kit Contribute — the flowback brain

Give each session-owned agent-system change an evidenced disposition. Adoption, overlay promotion,
discard, deferral, candidate review, and sync-pending work are legitimate outcomes. Completion
means no unexplained owned remainder; it does not require every change to land in this session.

## When to Use

- A caller requests codification or flowback during wrap-up.
- A diagnostic reports locally edited core content.
- An authorized change to kit-owned guidance needs a destination or provenance record.

## Approach

### Phase 1: Detect

Required local capability for shipped-state comparison and managed transfer: the agentkit CLI
and its Node runtime. Resolve the known kit checkout or documented installation first. Vendor
hook configuration is an optional path hint, not the only discovery method. Here `agentkit`
means that verified executable, or `node "<kit-root>/agentkit.mjs"`. Resolve both the current
project and kit target before any write.

Run `agentkit check . --json` and inspect owned LOCALLY-EDITED/CONFLICT content plus new local
assets. Reconcile the assignment's initial state and changed paths; a global dirty tree does not
make another author's work yours. Also identify unwritten patterns this session actually
established. Absence of new durable truth is a valid result.

If the CLI is unavailable, use relevant source files and available Git diffs/history to identify
local changes. These cannot establish equivalence to the lock's shipped state, especially for
committed drift. Mark shipped-state comparison unavailable. Authorized canonical edits may
proceed; generation and managed transfer remain pending. Never simulate either by patching
vendor files or machine-written metadata. Do not install tools merely to clear this gate.

### Phase 2: Judge each item

Apply the codification gate in
[Parallel-Agent Orchestration — Shared Contracts](../../../.agent/rules/pattern-agent-orchestration.md),
§1. Preserve the learning's producer and evidence provenance. Candidate or provenance-absent
claims need the required re-verification before adoption; a senior/staff label alone is not
verification. A retrieved assertion and an observed behavior are different evidence kinds.

Resolve the action, target and writer under
[external mutation](../../../.agent/rules/pattern-external-mutation.md). Existing grants survive delegation.
Permission to record a project session does not necessarily cover edits in the kit repository.
Shared-tree authors return cross-owner work to the coordinator; they do not run Git, generation,
or metadata-writing commands.

Choose the destination by generality and evidence:

1. **General improvement.** Generalize project paths, domain terms and tool assumptions while
   preserving the demonstrated method and compatibility constraints. Use the kit's
   `governance/best-practices.md` and `governance/overlay-contract.md`.
   When the resolved project-to-kit transfer is authorized, `agentkit adopt . <file-rel>`
   performs adoption. It also writes kit version, changelog and compiled manifest content;
   these shared effects must belong to the executing owner. When authoring directly in the kit,
   edit the canonical source within the assignment and leave shared release/generation work
   with its owner; do not self-adopt just to manufacture a transfer.
   If the reverse-clobber guard refuses because the kit advanced, preserve both versions and
   inspect the printed base. Reconcile deliberately within authority; do not force away another
   contributor's work. Classify any contract/version change through the release owner.
   Adoption requires explicit source/transform provenance. A body citation cannot identify its target.
   Supported single-source body edits retain canonical metadata; composite/lossy outputs require
   editing the named canonical owner. An ambiguous legacy lock or missing hash-matched base leaves
   managed transfer pending. Follow `governance/mirror-contract.md` for recovery; never retry an
   incomplete adoption as if no kit-side changes occurred.
2. **Project-specific improvement.** Preserve the useful content under a unique `domain-*` or
   `project-*` routing name and arrange the overlay claim through the project's config owner.
   Treat renames as consumer migrations: update authorized callers and check routing collisions.
   The lock is machine-written. Never remove a lock entry by hand to make the old path appear
   project-owned. Have the generation owner preview the old core restoration/pruning and new
   overlay outputs through supported tooling. If the ownership transition cannot be completed
   safely, retain both the content and a pending owner/action; do not report promotion complete.
3. **Noise or rejected change.** Name the exact change and why it should be discarded. Preserve
   useful content first and apply only an authorized, scoped restoration through its owner.
   `sync --force` has project-wide writes and prunes; there is no per-file force-sync selector.
   An authorized forced sync requires reviewing the entire
   `agentkit sync . --dry-run --force --json` plan, reconciling settings/managed-key effects with
   the current lock, and preserving every affected item. A one-file grant cannot cover that
   operation. If no supported scoped action fits, retain a discard-pending
   disposition with its next owner rather than broadening the command.
4. **Deferred or candidate.** Record why the decision or proof is pending, the retained content,
   its evidence/provenance, and next owner/action. `agentkit adopt . <file-rel> --defer` writes a
   queue in the kit checkout; use it only when that write is authorized. Otherwise use the
   caller's existing permitted record. Distinguish a confirmed queue entry from a proposed
   deferral; do not claim the queue exists without observing the result.

Do not publish private source evidence, machine paths, or ignored reports inside a generalized
asset. Preserve evidence locally and use ship-safe provenance where required. Source promotion
does not approve a separate project decision.
The kit advances coherently on explicit sync. Use exclusions or a distinct project overlay for
capability/project choices; per-file pins are unsupported. An ownership transition keeps the old
machine record until tooling reconciles it. No pin workaround or lock reset makes that transition safe.

### Phase 3: Verify and return

When available and within the caller's assigned checks, repeat `agentkit check . --json` after
applied changes. Reconcile each owned item's before/after state with its disposition. An explained
deferred, candidate, or sync-pending item may still show drift. Do not clear unrelated changes or
equate a clean Git diff with clean shipped state.

Return each applied or retained item's location, evidence, actual command effect, and pending
owner/action. Reuse the caller's report or session record; do not require a separate log for a
small pass. Actual source changes need the canonical changelog entry through its owner. Record
an adoption result as observed; integration, release and remote publication require their own
evidence. Return to the caller without invoking wrap-up or land.

## Definition of Done

Every identified session-owned item has a disposition and enough preserved context to act on any
remainder. Adoption claims have the required provenance and re-verification. Applied transfers
have observed results; unavailable checks and residual drift are explicit. No change is valid.
Do not force adoption, discard, publication, or another owner's cleanup to make a status green.

## What this skill replaces

`pattern-codify` is the legacy name for the unwritten-pattern question in Phase 1. This skill owns
disposition; the shared rules and kit governance own provenance, authority and asset shape.

## What we deliberately did NOT do

Do not edit generated vendor copies or machine metadata, invent file-scoped sync, or require
same-session landing when an explained remainder preserves the work.
