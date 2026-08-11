---
name: verification-profiles
description: Project-owned capability profiles for browser/runtime evidence and exact-tree reuse.
last-verified: 2026-08-09
---

# Verification Profiles

Projects declare capabilities; AgentKit does not assume that every vendor surface can drive a
browser. The optional `.agentkit.json` block is:

```json
{
  "verification": {
    "browser": {
      "profile": "deterministic-harness",
      "harness": "playwright",
      "target": "http://localhost:3000",
      "flow": "docs/knowledge-base/testing/browser-smoke.md"
    }
  }
}
```

`profile` is one of:

| Profile | Automated runtime lane | Human lane |
| --- | --- | --- |
| `native-browser` | A callable in-app/native browser may run a bounded smoke flow. | Optional follow-up for subjective or privileged checks. |
| `deterministic-harness` | The declared harness runs deterministic fixtures and assertions. | Optional follow-up for checks the harness cannot observe. |
| `human-only` | Agent reports `needs-human-verify`; it does not claim browser evidence. | Required owner and exact pending flow. |

`harness`, `target`, and `flow` are required for `deterministic-harness`; `target` and `flow` are
recommended for `native-browser`; `human-only` may omit them. An absent profile resolves to
`human-only` with `conservative: true`. Unknown or malformed profiles are errors, not permission to
guess a browser capability.

The profile controls lane selection only. It does not replace focused machine tests, the one broad
final-tree gate, or release validation. Browser evidence must name the exact URL/harness, fixture,
one or two interactions, expected visible/console/request state, retry limit, and observed result.

## Exact-tree verification receipts

Use `agentkit receipt` to record a machine-readable result after a gate has actually run:

```text
node agentkit.mjs receipt . --lane machine --command "npm test" \
  --status passed --exit-code 0 --out .agentkit/verification/gate.json
node agentkit.mjs receipt . --check .agentkit/verification/gate.json
```

Each receipt carries a schema version, lane, exact command, true exit code, and a tree identity. A
clean commit uses its commit/tree SHA; a dirty tree uses a deterministic working-tree digest that
includes tracked and non-ignored untracked files. Receipt files under `.agentkit/verification/` are
excluded from that digest so writing or checking a receipt cannot invalidate the evidence it records.
The check command exits non-zero when the current identity differs, so stale evidence cannot be
silently reused after a code or configuration change.

`needs-human-verify` and `not-applicable` receipts are useful status records but are not reusable
machine-green proof. Never record a passing receipt until the runner's real exit code and pass line
have been observed.
