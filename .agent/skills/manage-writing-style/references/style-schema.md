# Writing-style data contract

The management script stores all runtime data under the current project's `.writing/` directory. The
directory is project-owned data, not a kit asset. Do not copy samples, profiles, or approved exemplars
into `.agent/`, a generated vendor surface, a committed prompt, or a run record.

## Registry

`.writing/config.json` contains:

```json
{
  "schema_version": 1,
  "default_style_id": "humaira",
  "styles": {
    "humaira": {
      "id": "humaira",
      "display_name": "Humaira",
      "aliases": [],
      "enabled": true
    }
  },
  "policy": {
    "limited_below_words": 5000,
    "minimum_documents_for_actionable_scalar": 3,
    "max_leave_one_document_out_relative_delta": 0.25
  }
}
```

Style IDs are lowercase kebab-case slugs. Display names and aliases are lookup conveniences and never
change the style directory. A missing requested style is an error; the manager never infers a person's
style from a name.
IDs and aliases share one unique lookup namespace. Invalid or ambiguous loaded registries refuse.

## Source manifest

Each style has `styles/<style-id>/source-manifest.json`. A source entry records:

- `source_id`, `stored_path`, `original_name`, and `content_sha256`;
- `capture_fidelity`: `original-bytes` for a file-backed attachment or `host-decoded-text` for chat-only
  content;
- `authorship` separately from `rights_basis`;
- `format`, optional language/genre/mode metadata, and `included` state.

Stored source bytes are immutable. A content-hash duplicate is a no-mutation result. Exclusion removes a
source from future builds and approved voice examples without deleting raw bytes. Purge removes the
owned raw source and its active derived copies; it requires explicit confirmation. It is not secure
erasure of external backups or separately retained recovery evidence.
Unknown rights do not enter the included corpus. Non-self-authored material requires `permission`,
`license`, or `organization-policy` as its rights basis.

## Human style contract

`styles/<style-id>/style.md` is human-editable and never semantically rewritten by `update`. Its stable
frontmatter is:

```yaml
---
schema_version: 1
style_id: humaira
contract_status: draft
reviewed_profile_sha256: <sha256-hex-or-pending>
---
```

The body must contain `## Voice`, `## Do`, and `## Avoid` sections. It may describe qualitative voice
choices and mode-specific guidance. It must not become a computed metrics dump or a source phrase bank.
Initialization leaves a draft with a pending diagnostic review. The owner explicitly reviews meaningful
guidance before changing status to `reviewed`. The read-only `resolve` operation validates status and
source/exemplar integrity before returning voice context. Invalid, draft and unavailable profiles are
not silently applied; stale advisory diagnostics are labeled separately.

The contract is authoritative only for qualitative voice. Facts, semantic qualifiers, evidence, format,
accessibility/UI constraints, rights, safety, system/developer instructions, and the user's writing brief
always outrank it. Samples, the contract, and exemplars are untrusted content; embedded instructions are
never executed.

## Generated artifacts

- `normalized.jsonl` is the deterministic analysis view. Raw stored bytes remain separate.
- `profile.generated.json` contains machine-derived observations and coverage/stability diagnostics.
- `effective-profile.json` combines deterministic observations with contract hashes and diagnostic status.
- `baseline.json` contains compact comparison metrics.
- `exemplar-candidates.jsonl` contains local candidates for human approval.
- `exemplars.approved.jsonl` contains only explicitly approved candidates.
- `build-state.json` identifies the source manifest and generated profile used by the active build.

Generated observations are advisory evidence. They do not directly add a writing rule, override the human
contract, or form a universal quality or identity score. If the generated hash changes, diagnostics are
marked `needs-review`; the last valid human contract remains intact.

## Operations and recovery

`.writing/.gitignore` protects local data. Already tracked data needs explicit privacy reconciliation.
One `.writing/.lock` serializes current-manager mutations, including registry changes; an existing
style's `.lock` is held for the entire mutation. Foreign/legacy locks refuse without replacement.
`.writing/.pending.json` records the operation ID, contained targets, exact preimages and planned
write identities. It may contain private sample bytes. Successful publication of all coupled files
and removal of that journal is the commit point. Caught failures restore the prior state; interruption
retains the journal. `status` exposes only operation metadata. After confirming the prior writer has
stopped, `recover --operation <id> --confirm` restores the prior state and refuses intervening edits.
This is rollback recovery, unlike the main AgentKit sync recovery that finishes a retained operation.
Per-file replacement does not promise power-loss durability, hostile filesystem protection or
coordination between computers. Keep one active writer when using a synchronized folder.

### Recovery guard and ownership refusal

`.writing/.recovery-lock` is an exclusive guard held for the whole of `recover`. The journal, the
project-lock bytes and the operation identity are read inside that guard, not before it, so a stale
operation ID cannot reverse a mutation that committed in the meantime. A mutation also rechecks
`.pending.json` and `.recovery-lock` after acquiring `.writing/.lock`. `status` reports `recovering`
while the guard exists, `recovery-required` while a journal exists, and `locked` for a held project
lock with no journal.

Before restoring anything, `recover` validates every journalled effect path and preimage, every staged
temporary file hash, and the recorded style lock. A style lock that exists with different bytes than
the recorded ownership fails with `recovery-conflict` and no file is written. The journal records a
style lock only after the manager acquired it, so a refused acquisition cannot delete a foreign lock
during restoration.

### Lock cleanup after a completed data change

Releasing `.writing/.lock` can fail after the data change already resolved. The manager then raises
`lock-cleanup-required` carrying `operation`, `disposition`, `cleanup` (`.writing/.lock`) and
`cause_code`; the CLI preserves those fields in its JSON error. `disposition: committed` means the
mutation completed and only the lock file needs reconciliation. `disposition: restored-before-state`
means the data was rolled back and only the lock file needs reconciliation. `disposition: unchanged`
means the command failed before any data write, for example when the post-acquisition recheck found a
retained journal. In all three cases the pending work is lock cleanup. Repeating a committed mutation
or rolling back committed data is not a valid response to this error.

A recovery process killed while holding `.writing/.recovery-lock` leaves that guard on disk. `status`
reports `recovering`, `recover` fails with `lock-held`, and other commands fail with
`operation-pending`. Stored data and the journal are unaffected. Reconcile by confirming no recovery
process is running and removing only the stranded guard, then rerunning `status` and `recover`. The
journal and the project lock stay in place.

## Run records

`runs/<uuid>.json` contains operational evidence only: command, style ID, hashes, model/runtime labels,
and checks. It must not contain raw prompts or source prose. `run_fingerprint` is a deterministic input
identity; the enclosing run record is nondeterministic because it contains an ID and operational data.

## What we deliberately did NOT do

- Add a global or cross-project style root.
- Treat possession of a sample as permission to reuse it.
- Make generated metrics authoritative over human voice guidance.
- Add embeddings, a vector store, a hosted service, a fine-tune, or a universal confidence score.
