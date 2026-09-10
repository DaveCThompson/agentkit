---
name: migration-checklist
description: The per-project Phase-E migration procedure — preconditions, steps, verification, rollback. Copy-based rewrite of a predecessor kit/specs/migration-checklist.md.
last-verified: 2026-07-03
---

# Migration Checklist (Phase E, per project)

*Supersedes `a predecessor kit/specs/migration-checklist.md`. CLI guards support, but do not replace,
scoped authority, target inspection and verified preservation of local content.*

## First computer setup and project initialization

Use one selected local kit checkout and the Node version declared by its package. Git provides
recorded-state inspection and recovery. Selection does not install optional tools. Identify the
checkout, package version, commit and relevant uncommitted inputs before an update; sync consumes
that working source without a network pull or automatic version selection.

Create the chosen machine-local bin directory first and use its absolute path. The launcher command
is `node "<kit>/agentkit.mjs" setup --bin-dir "<absolute-local-bin>"`.
It creates a launcher bound to that checkout and Node executable; add that directory to PATH.
An existing different launcher refuses until its binding is reconciled. On Windows, unsupported
quote/expansion characters in the bound executable paths refuse; do not infer arbitrary-shell-path support.
There is no per-project binding file. Inspect the installed help and confirm `agentkit --version`
resolves the intended launcher in the shell used by the agent. A version probe is not native
hook/discovery proof. Setup writes local launchers; it is a separate action from project initialization.

Initialize a new project with explicit selections, for example:

```text
agentkit init "<project>" --vendors claude --stack react --kinds app --tools codebase-mcp
agentkit check "<project>" --json
```

Choose the real vendors, stack, kinds and tools. App-kind initialization recommends graph/Fallow
tools; non-app initialization defaults to no tools. An unavailable optional prerequisite is reported
and uses its documented fallback. Initialization and successful first sync are separate outcomes;
inspect both. Fleet enrollment is a separate edit to the computer-local roster, not an init effect.

Commit consumer intent, completed lock and generated guidance through the project's Git owner.
Keep `.agentkit.pending.json` and `*.agentkit-stage-*` in `.gitignore`; search exclusion in `.ignore`
alone does not prevent publication. Pending records can contain exact private settings bytes.
Neither pending operations nor local launchers belong in portable committed project state.

## Another computer, relocation and template derivation

A same-project clone keeps its project intent and inherited completed lock. Its committed guidance
remains available without running setup. Set up the selected compatible kit on the second computer
and expose its launcher on that computer's PATH. The shared hook command is
`agentkit check . --quick --json`; it resolves the active project at runtime. Confirm the invoking
client's working directory and launcher resolution on each supported platform before claiming native
portability. Missing setup does not authorize an implicit install or sync.

A template-derived project needs explicit identity/overlay/selection triage. The `init --clone-rebind`
contract preserves the inherited lock through reconciliation; it is not permission to reset
CHANGELOG, working evidence or ownership. Keep/change/retire each inherited contribution deliberately.
If the installed CLI still discards the lock on this path, do not use it for migration.

For cloud-synced checkouts, verify required source and recovery files are fully available locally
before offline work. Keep only one active writer across computers and wait for synchronization before
switching. A local coordinator lock is not a distributed lock. Two local fixture directories test
relocation mechanics, not a second device, cloud service, offline hydration or another OS.

## Preconditions (hard gate — do not start otherwise)
- [ ] Confirm the selected kit checkout, package version and commit match the intended update.
  A check invoked through an older feature checkout does not certify a newer consumer lock. Pulling
  one checkout does not update launchers bound to another. Do not edit the lock to hide a mismatch.
- [ ] Before enabling the portable SessionStart hook, verify launcher resolution in the invoking
  client's environment. From the project, run `agentkit --version` and `agentkit check . --quick --json`;
  an existing drift result may need reconciliation, but command-not-found is missing setup. Compare
  with the selected checkout's direct Node invocation when diagnosing. Complete machine-local setup
  and refresh the client's inherited environment before calling the hook usable. A successful command
  in another shell is not client proof; retain that check as pending if the client is unavailable.
- [ ] Inventory staged, tracked, untracked and useful ignored content. Preserve unrelated work;
  do not commit or stash it merely to clear status. Coordinate overlapping writers.
- [ ] Record an exact pre-migration source state and separately verify recovery of local-only
  content. A tag covers committed content only. Publication is not required for local recovery.
- [ ] Reconcile changed scope/source/ownership since any reused inventory. Inventory writes kit
  metadata and reports; run it only through its owner when that evidence is needed.
- [ ] Applicable kit evidence identifies the selected candidate; the release owner owns `npm test`
  and required environment/migration checks. A previous version's green suite is not current proof.
- [ ] No unresolved pending operation. Retain private recovery data and finish reconciliation before
  another mutation. A missing compatible command blocks that transition, not independent inspection.

## Steps
1. Write `.agentkit.json`: vendors actually used, `stack` (drives tech packs), overlay globs for
   genuine project content (`domain-*`, `project-*`, plus anything the audit flagged), and
   **`sourceRoots`** — the array of real source directories this repo uses (e.g. `["src"]`,
   `["app","components","lib"]`, `["apps","packages"]`). The content-integrity guard and `verify-rules`
   read it as the scan scope, including layouts that do not use a src directory
   (defaults to a broad set when omitted). Keep the same facts in the project's existing guidance.
   `templates/project-invariants.md` is an optional scaffold when a project fact rule is needed;
   it is not a requirement to duplicate an existing contract under a second filename.
   - **Claim every project-owned file explicitly.** Any `.agent/` file the project keeps that is NOT
     matched by an overlay glob (`domain-*`, `project-*`) MUST be named in `.agentkit.json`
     `overlay.rules`/`overlay.skills` (e.g. a custom `foundation-responsive` rule, a bespoke skill).
     A file that survives sync only because the kit happens not to ship it is **fragile** — the day
     the kit adopts that name, `sync --force` would treat the project's copy as an orphaned core file
     and prune/overwrite it. "Surviving by absence" is not a claim; list it.
   - **`tools`** — app-kind `agentkit init` recommends `["codebase-mcp", "fallow"]`
     (`governance/DECISION-default-tool-baseline.md`), as a recommendation to evaluate, not a fixed
     requirement. Drop `fallow` if there's no real JS/TS surface to scan; drop `codebase-mcp` if the
     codebase is small enough that Grep/Read already comprehend it without a graph. Keep what
     genuinely earns its keep on this project.
   - **`docs.kbRoot`** — one contained repository-relative KB directory, default
     `docs/knowledge-base`. Use `governance` for this kit; preserve sanctioned nested layouts.
   - **`exclude`** — exact canonical rule/workflow paths, or `.agent/skills/<name>` for a whole skill
     bundle and its resources. An individual skill-file path is not a supported exclusion ID.
     Unknown exclusions and unsatisfied required dependencies refuse;
     a conditional citation alone is not a required dependency. No glob/version resolver is implied.
   - **Legacy `pins`** — absent or `{}` is compatible. Nonempty or malformed values must refuse
     before writes. Preserve existing values until the owner chooses to keep the old installation
     or deliberately remove them and preview the coherent update. Never erase them automatically.
2. `agentkit sync <project> --dry-run` — review the incoming diff. Expected on first migration:
   mass UNTRACKED-DIFFERS refusals (pre-migration content is not lock-tracked yet).
3. Reconcile useful variants: adopt only generalized, authorized single-source changes with verified
   provenance into the kit, or preserve project-specific content as a distinct overlay. Adoption also
   writes kit package/changelog/manifest; deferred adoption writes a queue. Each needs the matching
   target owner. Body citations or ambiguous legacy lock entries cannot select an adoption target.
   - **Legacy hooks/settings:** sync can preserve an old absolute-path hook and add the portable hook
     because historical membership does not prove ownership. `OWNERSHIP-UNRESOLVED` means a disposition
     is still needed, even after successful file application. Inspect the exact reported native
     contribution and its preserved preimage. Once the replacement works and retirement is authorized,
     remove only the superseded old hook from native settings, retaining unrelated hooks and policy,
     then sync and check again. Verify one intended kit SessionStart check remains. Do not bulk-clear
     settings, rewrite generated skill files, or restore machine-specific paths as fleet policy.
   - **Managed blocks:** a release changes the `AGENTS.md` and `.codex/config.toml` managed blocks.
      Sync refreshes an `introduced` or `borrowed` block whose bytes still match the lock record. It
      refuses a block edited inside the markers. For a legacy `unresolved` block, compare the
      reported current, prior and desired hashes, then select a disposition. To keep the local
      content, leave its body intact and leave the incompatible kit update pending. To accept the
      kit value, clear only that block's body while retaining both markers. This explicit empty-marker
      enrollment is supported for both Markdown and TOML and records new `introduced` ownership on
      sync. In a Git checkout, the marker-only edit must be committed before sync only when the
      selected Git action authorizes committing. If the selected action is `prepare a diff`, preserve
      the reviewed marker-only edit in that diff and report the guarded application step pending;
      do not commit or bypass the managed-path dirty guard. Reconcile one block at a time. Do not
      empty the whole native file, use `--force`, or hand-edit the lock. An introduced or borrowed
      conflict must be restored to its exact recorded value before rerun; removing that block while
      it is edited is refused.
   - **Existing writing data:** sync adds `.writing/` to the project ignore file. That does not
     untrack a `.writing` path a project already committed. Check `git ls-files .writing` before the
     first writing operation and decide explicitly whether to untrack or keep those files.
   - **References and local work:** resolve active kit governance citations in the selected kit
     checkout; keep project truth in the declared project KB. Repair migration-created broken routing
     at its canonical owner. Separate pre-existing documentation warnings from upgrade regressions.
     A report-only branch does not preserve the source machine's uncommitted overlay or ignored data.
4. Use `agentkit sync <project> --force` only when the reviewed full overwrite/prune scope is
   authorized and every affected local variant is recoverable. It is not a one-file selector.
   Inspect actual results and retain refusals or ambiguous state for reconciliation.
5. Inventory legacy vendor files the lock never owned. Remove only exact authorized, inactive,
   recoverable targets proven superseded by generated outputs. Unknown ownership stays untouched.
6. `agentkit check <project> --json` → inspect files, managed settings, source identity and pending
   state. Review actual writes/prunes and conflicts. A partial operation is not successful sync.
7. Check declared tools through the integration registry and actual runtime. Provision only
   within installation/configuration authority. Missing optional tools use their documented fallback;
   a CLI version probe is not proof that a particular agent can call an MCP server.
8. Run the project's applicable verification commands and an agent-surface routing smoke check.
   Do not assume a `/verify-standard` command exists.
9. Record source/state, actual effects, preservation evidence, refused/unresolved ownership and proof
   limits in the accepted work item or assigned report. Create a separate report only for a distinct
   reader or responsibility. Do not publish private settings or ignored evidence links.
10. Under granted Git authority, commit the scoped configuration, lock and generated outputs.
    Preserve local recovery evidence. Push or other publication needs its own applicable grant.

## Rollback

Resolve or finish pending operations first. `agentkit recover "<project>"` completes the retained
before/after operation; it is not a version rollback. Adoption recovery runs at the kit root.
Inspect the retained targets and selected root before invoking recovery. Intervening edits stop it;
preserve them and reconcile through the operation owner. Never delete pending state to bypass refusal.
Do not copy an active pending file between computers as if it were completed project state.

Before rollback, preserve exact useful ignored recovery/evidence and computer-local setup separately.
Compare recorded pre-migration state with the owned diff. Through the Git owner, restore coupled
consumer configuration, canonical copies, generated outputs, shared settings and completed lock using
scoped reviewable reversions. Use a CLI compatible with that restored schema/source before any new
mutation. An older binary may ignore a newer schema; restoring only a lock or regenerating old state
from an unrelated current kit is unsafe. Inspect and verify the restored installation before choosing
another explicit sync. Do not reset the workspace or assume Git contains ignored files.

Reverse kit-side adoption separately with its owner; consumer rollback does not undo it or external
publication. The bounded recovery record supports tested interruption paths, not cross-file atomicity,
power-loss durability or hostile concurrent filesystem replacement.

## Stop updates, remove capabilities or retire ownership

- To stop updates, stop invoking sync. The installed guidance and ownership remain intact.
- To remove a vendor/tool or exclude a capability, edit that selection and preview explicit sync.
  Retire only proven owned unchanged outputs/contributions; preserve edited, borrowed and unresolved
  legacy settings. Empty vendors still retains selected canonical content.
- In the local fleet roster, `status: out` means omit that project from active fleet diagnostics.
  It does not remove files, disable tools or unsubscribe ownership inside the project.
- Full retirement needs an explicit reviewed removal/ownership transition. There is no blanket
  uninstall recipe: retain overlays, unrelated settings, edited files, completed ownership and useful
  evidence until the authorized transition accounts for them. Do not delete the lock to retire it.

Native/client, minimum-runtime and Windows/POSIX checks gate their corresponding portability claims.
Source inspection and help checks alone do not satisfy them.

## Wave rules
Pilot: one project. Wave 2: 2–3 projects. Wave 3: the remaining app-shape projects. Bespoke:
any monorepo / sanctioned-layout outlier (see `docs-standard.md` §g), migrated on its own plan.
**Verification gate between waves** — a wave starts only when the previous wave's projects all pass
step 6–8. (The concrete roster and sequencing live in your local `fleet.json`, not here.)
