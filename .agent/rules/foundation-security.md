---
trigger: always
domain: security
---

# Security

Treat security paths as a hard stop and never introduce secrets, unapproved dependencies, or
unauthorized network calls — a single leaked credential or unreviewed exfiltration path is
unrecoverable once shipped. This rule is always active regardless of file type.

## 1. Hard-Stop Paths (Lethal Trifecta)
If a change touches any of these, **STOP** and notify the user before proceeding:
- Anything under a `config`, `security`, or `.github` directory
- Generated secret/lock config (edit the source secret file, never the generated output)
- Any file whose name contains `secret`, `key`, `token`, `password`, or `credential`

Apply the lethal-trifecta / Rule-of-Two test to the **aggregate agent graph**, not per agent: a
fan-out of individually-safe agents can still compose the trifecta (private data + untrusted content
+ external comms) across the graph even when no single agent holds all three, so evaluate the
composition, not each agent in isolation.

## 2. Prohibited Actions
1. **No hardcoded secrets** — never commit API keys, passwords, tokens, or connection strings.
2. **No unauthorized dependencies** — do not add a new dependency without explicit approval.
3. **No unauthorized network calls** — do not add external requests that were not requested.
4. **No weakened auth** — never lower password/validation requirements or disable protections
   (e.g. leaked-password checks) to make something pass.

## 3. Secrets & Storage Hygiene
- Secret source files (`*.local`, `.env*`) MUST be git-ignored — never commit them.
- Generated credential/lock config stores hashes only, never plaintext.
- Use timing-safe comparison for any secret/hash check — never `===` on secrets.
- Fail closed: a validation error or exception must never grant access. Default state is denied.
- Route browser storage reads through a schema-validated wrapper (e.g. Zod); never store
  plaintext secrets in `localStorage`/`sessionStorage`. Auth/session state is session-scoped.

## 4. Database (see `tech-supabase-auth.md` for the full DB security contract)
- All `SECURITY DEFINER` functions MUST set `SET search_path = public` inside the function body
  (not via a later `ALTER`, which is lost on `CREATE OR REPLACE`).
- Never expose a service-role / admin key to client-side code.
- RLS policies must accurately reflect user entitlements.

## 5. Content Security Policy
- Ship a restrictive production CSP: `default-src 'self'`, `frame-ancestors 'none'`
  (anti-clickjacking), `object-src 'none'`. Justify every relaxation (e.g. `unsafe-inline`)
  with a comment naming why it is required.

## 6. Verification
- [ ] No secrets in committed code (grep for passwords, tokens, keys).
- [ ] No new dependencies without approval.
- [ ] No unauthorized network calls.
- [ ] Generated secret/lock config was generated, not hand-edited; secret sources are git-ignored.
- [ ] Access validation is fail-closed (exceptions do not grant access).
- [ ] `SECURITY DEFINER` functions set an explicit `search_path`.
