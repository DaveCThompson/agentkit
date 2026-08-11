---
name: audit-hygiene-enforcement
description: Verify project hygiene invariants — changelog rolled and titled, archives indexed, working docs within limits. Detect-only; maintain-docs performs the cleanup.
tier: core
conflicts-with: [maintain-docs]
---

# Hygiene Enforcement Skill

Logic for automating project maintenance and documentation hygiene.

## Instructions

This skill is **detect-only** — it flags violations but does not mutate files. Remediation is routed
to `maintain-docs` and the TICKET-02 CLI backstop.

When performing a maintenance audit:

1. **Changelog Management** (detect only):
   - Check the total line count of `./CHANGELOG.md`. If > 500 lines, flag it.
   - Identify the most recent milestone header.
   - Check whether entries older than 3 days remain in the live file without an archive link.
     Flag if found — do not extract or archive.

2. **Documentation Hygiene** (detect only):
   - Scan `docs/working` for `.md` files that have been marked as "Implemented" in `./CHANGELOG.md`.
     Flag them — do not move them.
   - Check that `docs/specs` is absent or empty. Flag if present (durable specs belong in
     `docs/knowledge-base/specs/`; temporary planning artifacts belong in the four-directory model).

3. **Structural Rigor**:
   - Enforce kebab-case for new directories in the feature tree and `.agent/skills`.
   - Check for "Rule Drift": verify that any new patterns documented in recent `CHANGELOG.md` entries
     have corresponding updates in `.agent/rules/`.

4. **Drift Heuristics** (prose checks — the deterministic backstop is TICKET-02's CLI check):
   - **SHA-contradiction check**: if an open ticket cites a commit SHA that is an ancestor of
     `origin/main`, flag the ticket — the fix has merged while status says "Open".
   - **Duplicated-status check**: if the same ticket's status is restated in more than one place
     (ticket frontmatter + index + prose body), flag as drift-prone.
   - **Stale-ticket check**: if a ticket is unchanged or carries `needs-human-verify` and its
     `last-updated` is older than `thresholds.staleTicketDays` (from `.agentkit.json`), prompt to
     close or re-prioritize.

## Notes
- Every lens ends in findings or an explicit clean attestation — name what was checked and state it came back clean; a lens with neither is an under-delivered audit, not a pass.
- Raw command output goes to `docs/working/evidence/` (gitignored); findings docs cite the evidence file by name.
- Archival target is always `docs/archive/YYYY-MM/` derived dynamically from `(Get-Date -Format 'yyyy-MM')`
  (PowerShell) or `date +%Y-%m` — never hardcoded.
- No standalone scripts exist for these operations; implement the detection logic directly.
- Tickets flagged by these heuristics should be surfaced in a hygiene report for human triage;
  automated close/re-prioritize is the TICKET-02 CLI's domain.
