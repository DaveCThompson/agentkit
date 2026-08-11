---
trigger: always
domain: testing
---

# Browser and Interactive Runtime Verification

Browser work is decided by the required verification lane, the project's profile, and the
capabilities available in the current session. This rule owns that decision; individual workflows
and skills must not add a blanket browser prohibition or an unconditional manual-review prompt.

## Project capability profiles

Projects may declare `verification.browser.profile` in `.agentkit.json`:

- `native-browser`: a callable in-app/native browser is reliable for bounded smoke flows.
- `deterministic-harness`: a declared browser harness (for example Playwright) is reliable; use its
  deterministic fixtures and keep interactive browsing opt-in.
- `human-only`: no automated browser lane is claimed; runtime evidence remains
  `needs-human-verify`.

When the profile is absent, AgentKit resolves the browser lane conservatively to `human-only`. A
profile is project capability metadata, not a fleet-wide tool requirement. The project must still
name the target, fixture, flow, and owner in its verification contract.

## Decision order

1. Read the ticket/plan's verification lanes and Acceptance criteria. A browser is evidence for a
   declared `runtime` or `human` lane, not a substitute for machine or documentation proof.
2. Read the project's profile and policy when present (`.agentkit.json`, `AGENTS.md`, or the
   project's governing verification document). A project may allow, require, or reserve browser
   work for a human.
3. Inspect the actual session capabilities. An in-app browser, native browser control, Playwright,
   or a browser MCP is usable only when it is callable here; never infer capability from a mention
   in a plan or from another vendor's surface.
4. If the profile permits the capability and the lane requires it, use it and record the exact flow,
   capability, target environment, and evidence. If the capability is unavailable or the profile
   assigns the lane to a human, stop at `needs-human-verify` and name the exact check.

## Defaults and boundaries

- With no project profile, use an available browser capability only when the ticket/plan calls for
  runtime/browser proof or the user asks for a screenshot, recording, or demonstration. Otherwise
  keep the work at the machine lane and do not invent a browser step.
- Browser capabilities are not fleet-wide required tools. Add a Playwright/browser dependency only
  when a project profile provisions it and a real Acceptance item needs it.
- Browser use does not replace `lint`, `typecheck`, focused tests, the broad final-tree gate, or
  release validation.
