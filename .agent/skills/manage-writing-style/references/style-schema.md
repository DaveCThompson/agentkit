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

## Source manifest

Each style has `styles/<style-id>/source-manifest.json`. A source entry records:

- `source_id`, `stored_path`, `original_name`, and `content_sha256`;
- `capture_fidelity`: `original-bytes` for a file-backed attachment or `host-decoded-text` for chat-only
  content;
- `authorship` separately from `rights_basis`;
- `format`, optional language/genre/mode metadata, and `included` state.

Stored source bytes are immutable. A content-hash duplicate is a no-mutation result. Exclusion removes a
source from future builds without deleting it. Purge is destructive and requires explicit confirmation.
Unknown rights do not enter the included corpus. Non-self-authored material requires `permission`,
`license`, or `organization-policy` as its rights basis.

## Human style contract

`styles/<style-id>/style.md` is human-editable and never semantically rewritten by `update`. Its stable
frontmatter is:

```yaml
---
schema_version: 1
style_id: humaira
contract_status: reviewed
reviewed_profile_sha256: <sha256-hex-or-pending>
---
```

The body must contain `## Voice`, `## Do`, and `## Avoid` sections. It may describe qualitative voice
choices and mode-specific guidance. It must not become a computed metrics dump or a source phrase bank.

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

## Run records

`runs/<uuid>.json` contains operational evidence only: command, style ID, hashes, model/runtime labels,
and checks. It must not contain raw prompts or source prose. `run_fingerprint` is a deterministic input
identity; the enclosing run record is nondeterministic because it contains an ID and operational data.

## What we deliberately did NOT do

- Add a global or cross-project style root.
- Treat possession of a sample as permission to reuse it.
- Make generated metrics authoritative over human voice guidance.
- Add embeddings, a vector store, a hosted service, a fine-tune, or a universal confidence score.
