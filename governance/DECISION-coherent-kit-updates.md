---
status: accepted
supersedes: DECISION-always-latest-upgrades.md
applies-to:
  - "agentkit.mjs"
  - "adapters.mjs"
  - ".agentkit.json"
  - "templates/**"
last-verified: 2026-09-08
---

# DECISION-coherent-kit-updates

## Context

The maintainer accepted coherent explicit updates and removal of per-file pins on 2026-09-08.
The earlier always-latest decision permitted a pin exception, but the reviewed implementation
advertised pins without applying them. A resolver would add mixed-version dependency and recovery
complexity. This decision replaces that exception and clarifies what source an explicit sync uses.
It preserves the historical decision and its rationale unchanged.

## Decision

Sync uses one selected local kit checkout, including its identified uncommitted inputs. It does not
pull from the network, select a release automatically or upgrade in the background. Selected standard
assets advance coherently. A project may retain its existing installation until its next explicit
sync. Capability opt-outs and separate project overlays remain available; per-file version pins do not.

Accept absent or empty legacy `pins` without changing selection. Reject nonempty or malformed pins
before mutation. The owner chooses to keep the prior installation or deliberately remove pins and
review the coherent update. Never erase pins and proceed silently.

Portable project intent and completed ownership travel with the project. Computer-local kit/tool
binding stays local. Clones retain inherited ownership through reconciliation. Preflight, typed
settings ownership and bounded recovery follow [mirror contract](mirror-contract.md); their runtime
acceptance requires the corresponding implementation evidence.

## Consequences

There is no per-file resolver, old-asset cache or override framework. Updates require review of the
chosen source and conflicts. Rollback restores coupled recorded state with a compatible CLI while
separately preserving ignored evidence and recovery data. A version number alone is not a source hash.

This is a major contract change. The release owner determines the pending release relative to the
last released contract; an unreleased candidate version does not itself require another major bump.

## What we deliberately did NOT do

No historical rationale was rewritten. This decision does not authorize live fleet changes or claim
native, cross-platform, second-computer or interrupted-operation proof has passed.
