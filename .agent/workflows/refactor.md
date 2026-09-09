---
description: Restructure code while preserving the agreed observable behavior and compatibility.
skill: implement-refactor
---

# Refactor Workflow

Use `implement-refactor` with the accepted structural goal, invariant surface and exclusions.
Identify consumers, compatibility and relevant non-functional constraints before changing their
implementation. Tests are evidence about their coverage, not proof of universal functional parity.

Keep behavior changes out of the refactor unless expressly accepted. If an existing defect is
discovered, record it and preserve compatibility or seek a scoped change decision. Return the
structural result, semantic comparison, actual checks and any unverified boundary.
