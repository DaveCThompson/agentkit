---
trigger: always
domain: security
---

# External Mutation Safety

Treat any action that mutates state outside the local working tree — an external service, MCP
tool, or API call that writes, sends, deploys, deletes, or publishes — as hard-to-reverse and
outward-facing. Local edits are undoable with git; an email sent, a deploy promoted, or a record
deleted reaches real systems and may be cached, indexed, or acted upon even if later "undone."
This rule generalizes the lethal-trifecta caution in `foundation-security.md` to the tool era,
and is always active regardless of which tool performs the mutation.

## 1. Confirm Before Irreversible or Outward-Facing Effects
- Sending, publishing, deploying, and deleting are outward-facing: **STOP** and get explicit
  authorization before the mutating call unless the user has already durably granted it.
- **Approval does not travel.** Authorization in one context (one target, one session, one task)
  does not extend to the next mutation — re-confirm per distinct action, not per category.
- When in doubt whether an operation is mutating, treat it as mutating.

## 2. Dry-Run / Read-Before-Write
- Prefer a preview, plan, or list step before the mutating call whenever the tool offers one
  (`--dry-run`, plan output, a read of the target record).
- Inspect the target first. If what you find contradicts how the task described it (wrong name,
  unexpected state, more matches than expected), **surface the contradiction and stop** — do not
  proceed on the assumption the description was right.

## 3. Idempotency & Blast Radius
- Prefer idempotent operations (upsert-by-key, PUT-with-ID) so a retry cannot double-apply.
- Scope every call to the smallest identifiable target — one record, one resource, one
  environment. Never mass-target ("delete all matching…") or fan a destructive operation out
  across a list; iterate deliberately with per-item verification if breadth is truly required.

## 4. Fail Closed
- An error, timeout, or ambiguous result must never escalate privilege, widen scope, or trigger
  a "try harder" retry with a bigger hammer. Default to the safe/no-op path and report.
- If a mutation may have partially applied, verify actual state before retrying — a blind retry
  of a non-idempotent call is itself a mutation.

## 5. Least Privilege & No Secret Leakage
- Never hand admin/service-role credentials to a call that a scoped credential can satisfy.
- Never place secrets in call arguments that get logged, echoed, or persisted; never log tokens,
  keys, or credentials in the audit trail. See `foundation-security.md` for secret hygiene.

## 6. Auditability
- Record every external mutation: which operation, against which exact target, with what real
  result (the service's confirmation — ID, status, URL), never a vague "done."
- If the result cannot be confirmed, say so explicitly; an unverified claim of success is worse
  than a reported unknown.
- Repo-specific escalation contacts and approved external surfaces live in
  `project-invariants.md`.

## 7. Verification
- [ ] Confirmation gate present for every irreversible/outward-facing action (send, publish,
      deploy, delete) — and not reused from a prior context.
- [ ] Read/dry-run performed first; contradictions surfaced, not steamrolled.
- [ ] Each call scoped to the smallest target; no mass-target or destructive fan-out.
- [ ] Failure paths are fail-closed (no scope-widening, no blind retry of non-idempotent calls).
- [ ] No admin credential used where a scoped one sufficed; no secret in call args or logs.
- [ ] Mutation logged with operation, exact target, and confirmed real result.
