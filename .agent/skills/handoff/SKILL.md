---
name: handoff
description: Generate a right-sized handoff ticket — lean by default for capable agents; escalates to a fully-specified junior-safe pack when handing to a junior/cheaper-model recipient or a high-risk surface. Use when work will be implemented by someone else.
tier: core
---

# Handoff Skill

Produce the smallest handoff artifact that lets the named recipient implement the work safely.
The recipient's capability tier — not habit — decides how much detail to generate.

## When to Use

- Handing implementation to another agent, model, or developer
- Work will happen without your supervision (external team, parallel worker, future session)

## When NOT to Use

- The work continues in this session → just keep working; no artifact needed.
- You're decomposing a monolith into many parallel tickets → `orchestrate-decompose`.
- You want a review of someone else's finished work → `review-peer` or `review-raise-bar`.

## Approach

### Phase 0: Calibrate the recipient tier (decides everything below)

Use the capability-tier vocabulary from `pattern-agent-orchestration.md` §1. Escalate to the
**junior pack** only on an explicit, checkable signal:

1. The user names a junior/cheaper-model/external-contractor recipient, or the invocation says
   `junior`.
2. The ticket would carry `**Agent Tier**: junior`.
3. The work touches a hard-stop surface (`foundation-security.md` §1).

**No signal → lean tier. Do not ask; state the chosen tier and its trigger in the output.**

### Phase 1: Requirement mapping (both tiers)

1. **Proof of understanding**: one-sentence feature summary.
2. **User impact**: what changes for the end user (1–2 lines).
3. **Technical scope**: predicted file surface as globs, dependencies touched.
4. **Assumptions**: list each one explicitly.
5. **Verify environment-coupled literals (W2-6):** every literal that couples to the environment
   (paths, config values, ignore patterns, port numbers, URLs) MUST be verified against the repo at
   pack-writing time. A literal you verified gets a `VERIFIED:` annotation. A literal you cannot
   verify gets a `VERIFY:` marker — it reaches the implementer as an unresolved question, never as
   settled fact. **A hardcoded `.gitignore` literal implemented faithfully into a fail-closed script
   that would refuse to write credentials is exactly the defect this step prevents.**
6. **Verification ownership:** declare the core lanes (`machine`, `runtime`, `human`, `docs`,
   `landing`) up front, with one owner and one evidence target per lane. Mark a lane `not applicable`
   explicitly. Extend only through the project's profile for project-owned lanes.

### Phase 2: Ticket generation — ONE file, the §2 contract

Write `docs/working/TICKET-<name>.md` carrying the ticket metadata contract from
`pattern-agent-orchestration.md` §2 so the handoff can flow straight into the orchestration
pipeline:

```markdown
# TICKET: {Feature Name}

**Status**: ready
**Priority**: {P1|P2|P3}
**Depends**: {ticket or none}
**Agent Tier**: {staff|senior|junior}
**Verify**: {machine|browser|real-device|staging}
**Verification lanes**: machine={owner/status/evidence target}; runtime={owner/status/evidence target}; human={owner/status/evidence target}; docs={owner/status/evidence target}; landing={owner/status/evidence target}
**Files**: {globs of the predicted surface}

## Objective
[What we're building and why — plus the one-line user impact]

## Decisions Already Made
[The selected approach and the constraints that bound it. Include an approach-comparison table
ONLY if the approach is genuinely undecided and the recipient must choose.]

## Milestones
### Phase 1: {Name}
- [Milestone-level outcome, not keystroke-level steps]

## Acceptance Criteria
- [ ] [Concrete, checkable outcomes]

## Gotchas
- [Short list: known traps in this surface, fragile exceptions to preserve]

## Verification Checklist
Apply the Graduated Verification Gate (foundation-testing.md) at this change's tier.
- [ ] `lint` + `typecheck` (always)
- [ ] Focused tests for the touched domain (behavior/schema/route change)
- [ ] `build` (SSR/routing/build-affecting change)
- [ ] Focused local proof is recorded with exact commands, true exit codes, pass lines, and the exact SHA/tree identity covered
- [ ] One broad gate is owned by the final standalone/integrated tree; cite it when CI or a prior local run covers the exact SHA/tree
- [ ] Release validation is named only when this handoff crosses a release boundary
- [ ] Each core verification lane (`machine`, `runtime`, `human`, `docs`, `landing`) has an owner, status, and evidence target, including explicit `not applicable` entries
```

### Writing pass (all tiers)

Before delivering the ticket, apply the clear-communication and UI-copy rules when relevant:

- Keep the title a concise imperative outcome. Include the object only when context does not supply it.
- State the current truth, gap, and user impact without repeating the same summary in several fields.
- Put settled decisions and constraints where the implementer will see them before the plan.
- Make each acceptance checkbox observable and keep one claim per checkbox.
- Use exact UI wording only when the wording is a behavior contract; otherwise describe the intended
  meaning and constraints.
- Preserve scope, conditions, exceptions, numbers, safety qualifiers, and exact literals.
- Keep the ticket concise, but do not make it telegraphic. End it with `What we deliberately did NOT do`.

**Lean tier stops here.** A senior/staff recipient gets decisions, surface, acceptance, and
gotchas — they do not need copy-paste code or an approach-comparison rehash of a decision
already made.

### Phase 3: Junior pack (escalated tier only)

Append to the same TICKET:

- **Step-by-step implementation guide** — exact files, exact order, exact imports.
- **Copy-paste-ready code snippets** — complete and runnable, with all imports and exact token
  names; no `...` elisions.
- **Test assertions as copy-paste snippets (W1-1):** tests get the *same snippet treatment as
  implementation code* — emit literal `expect(...)` lines the implementer pastes, never a prose
  description of what to assert. Example: instead of "assert the response is 400 when body is
  missing", write `expect(res.status).toBe(400)` and `expect(res.body.error).toBe('missing_field')`.
  A prose "add a test asserting no /skills op" produced a tautology ("the endpoint should not list
  skills"); every literal `expect(...)` came back correct.
- **Data flow / component hierarchy** — mermaid diagram when the flow is non-obvious.
- **Risk table** — `| Risk | Impact | Mitigation |`.
- **Common mistakes to avoid** — each with the concrete fix.
- **Red-proofs as per-gate checkboxes (W2-7):** where the plan mandates red-proofs (e.g. "gate X:
  failing output pasted, then green output pasted"), emit them as **individual acceptance
  checkboxes**, not paragraphs. Checkbox lists survive cheap/literal models better than prose
  descriptions. Example:
  ```markdown
  - [ ] Gate A — red output pasted below
  - [ ] Gate A — green output pasted below
  ```
  Never collapse both into a single "Gate A passes ✓" checkbox.

**Size split rule:** **Default: append the junior pack to the TICKET itself** (same file).
The `TICKET`+`PLAN` split is the **exception**, used only when one artifact would exceed ~250 lines.
When splitting: move execution detail (step-by-step guide + snippets + diagrams) to
`docs/working/PLAN-<name>.md` and link it from the ticket. The TICKET keeps the contract; the PLAN
keeps the how. Never use `REVIEW-` for handoff detail — per `governance/docs-standard.md` §c,
`REVIEW-` is an assessment, and a step-by-step execution guide is a `PLAN-`. WHY: defaulting to
in-place avoids the "lost PLAN" problem where a junior sees only the ticket; splitting is for
size management only, not a structural requirement.

### Phase 4: Reflexion — Chaotic Junior Dev (escalated tier only)

Assume the persona of a **Chaotic Junior Developer**:
> "I will skip reading documentation, copy-paste without understanding, and test only the happy path."

Attack vectors — document each in the risk table:
1. What breaks if I call functions in the wrong order?
2. What breaks if I forget to handle null/undefined?
3. What breaks if I copy this component to a different context?

## Constraints

- **Tier is stated, never silent** — the output names the chosen tier and the signal that chose it.
- **One file by default** — a second file (`PLAN-`) exists only via the size split rule.
- **No dead comparison tables** — a decided approach is stated, not re-litigated.
- **Tables cite exact filenames (W2-1):** any sequencing/wave table the pack emits must name the
  exact artifact filename/slug (`TICKET-37-mobile-nav-staff.md`), never an invented "wave+number"
  key the reader cannot find by directory listing.
- **Junior pack only:** no assumptions, no unexplained jargon, copy-paste-ready code, visual aids
  for complex flows.
- **Truthful verification**: any verification claims list the EXACT commands actually run and
  their real results (`foundation-testing.md` §1) — a vague "all green" is a defect that hides
  regressions from the implementer.

## Output

- `docs/working/TICKET-<name>.md` — always; carries the §2 metadata contract and the chosen tier.
- `docs/working/PLAN-<name>.md` — only when the junior pack exceeds the size split rule.
