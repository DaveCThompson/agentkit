---
name: mcp-server-ops
description: Design, run, debug, and secure a personal MCP server — native-transport-first selection (an stdio bridge only as an acknowledged last resort), the spec's Origin/token-audience/SSRF MUSTs, bearer-auth hygiene, read-only-first mounting, tool-description pinning, and a list-then-read-then-refuse-write smoke test. Use when adding, exposing, or troubleshooting an MCP tool server for a personal agent hub.
tier: kind:agent-infra
---

# MCP Server Ops

<!--
Sources for this skill (D3 cite-or-run — every claim below traces to one of these):
  [KB]    an earlier MCP operations evidence note
  [OPS]   an earlier agent-network operations skill
  [TKT]   the relevant agent-infrastructure review (orchestrator-verified facts, not project-specific)
  [SPEC]  MCP specification, revision 2025-11-25 — all three pages fetched 2026-07-25:
          [SPEC:transports] https://modelcontextprotocol.io/specification/2025-11-25/basic/transports
          [SPEC:security]   https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices
          [SPEC:authz]      https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization
  [RC]    MCP 2026-07-28 release candidate — fetched 2026-07-25:
          https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/
  [OWU]   the host's release notes for Streamable HTTP/OAuth support — verify the current version:
          https://github.com/open-webui/open-webui/releases
  [SCAN]  Snyk Agent Scan (formerly Invariant Labs mcp-scan) — fetched 2026-07-25:
          https://github.com/invariantlabs-ai/mcp-scan
  [STRAT] the operate-side kit docs/knowledge-base/strategy/STRATEGY-mcp-operations-posture.md (adopted posture)
-->

Operate a personal MCP server without widening its blast radius. MCP is the tool layer
every major agent vendor now ships against — treat it as the default integration surface
for personal tool exposure; A2A-style agent-to-agent protocols are optional extras at
personal scale and not required to get useful tool access working. <!-- [TKT] --> This
skill is host-agnostic: it applies to any personal agent hub that speaks MCP, not to one
specific project's runtime.

## Spec Revision

**This skill is written against MCP revision `2025-11-25`.** Every quoted MUST/SHOULD below
comes from that revision. <!-- [SPEC] --> State the revision in your own MCP docs too; a
transport or auth claim with no revision attached rots silently.

The **`2026-07-28`** revision moves the ground: the `initialize`/`initialized` handshake "is
removed" and the protocol becomes "stateless at the protocol layer"; "the `Mcp-Session-Id`
header and the protocol-level session that came with it are also removed"; the Streamable
HTTP transport "now requires `Mcp-Method` and `Mcp-Name` headers" so gateways can route
without inspecting the body; and **Roots, Sampling and Logging are deprecated**, with logging
moving to "`stderr` for stdio transports; OpenTelemetry for structured observability".
<!-- [RC] --> **Do not build on Roots, Sampling, or the MCP Logging capability**, and do not
key telemetry, routing, or a health probe off a session id. <!-- [STRAT] §1 -->

## When To Use

- Adding a new MCP server (yours or third-party) to a personal agent hub.
- Deciding whether a server needs a bridge or can connect natively.
- Diagnosing a `401`/`403` on an MCP tool call, or a tool that silently can't write.
- Reviewing whether a filesystem- or data-touching MCP server is scoped safely before
  turning it on for a chat session. <!-- [KB] Validated Architecture -->
- Re-checking a server's tool surface after upgrading or re-pointing it.

## Choose The Transport

**Default to the server's native transport. A bridge is a compatibility shim of last resort,
not the starting point.** <!-- [STRAT] §1 --> The 2025-11-25 spec "defines two standard
transport mechanisms": stdio and Streamable HTTP. <!-- [SPEC:transports] -->

| Server speaks | Use | Why |
| --- | --- | --- |
| Streamable HTTP | A direct/native MCP connection — **the default** | No extra process in the path; nothing spawns child processes on the host's behalf. |
| stdio, and the host can launch subprocesses | Direct stdio — the host launches the server itself | Spec: "Clients **SHOULD** support stdio whenever possible", and a local server "**SHOULD** use the `stdio` transport to limit access to just the MCP client". <!-- [SPEC:transports]; [SPEC:security] Local MCP Server Compromise --> |
| stdio only, and the host speaks HTTP only | An HTTP bridge (e.g. `mcpo`) — **an accepted risk, not a neutral choice** | The only justification is that the host cannot speak the server's transport. Run it under the sandbox caveat below. |
| HTTP+SSE only | Treat as legacy; prefer upgrading the server | HTTP+SSE is the deprecated 2024-11-05 transport, replaced by Streamable HTTP. <!-- [SPEC:transports] --> |

**Why the bridge is not the default.** The spec names a proxy that spawns MCP servers as
child processes as an escalation path: in that architecture, client-side XSS lets an attacker
steal the proxy's auth token and make the proxy "spawn arbitrary commands via the `stdio`
transport", reaching "Remote Code Execution with user privileges". The mitigation is
normative on the proxy — "MCP proxy services **SHOULD** implement additional security controls
for `stdio` transport: Implement sandboxing or containerization for spawned processes…
Restrict file system access for spawned MCP servers… Log all `stdio` transport usage for
security monitoring".
<!-- [SPEC:security] "stdio Transport Security in Proxy Scenarios" --> If you run a bridge,
run it under those controls and treat its spawned processes as an escalation surface.

**Host transport support is not a constant — check it, do not assume it.** A host may add
Streamable HTTP or OAuth support over time <!-- [OWU] -->, so older guidance that its servers must
all go through a bridge can become stale. Verify your own host's supported transports; never add
a bridge process for a server that already speaks Streamable HTTP. <!-- [TKT]; [STRAT] §1 -->

For a high-consequence write action, prefer a narrow, purpose-built tool over exposing a
broad general-purpose interface (e.g. a full shell or a write-capable filesystem tool)
through any transport. <!-- [OPS] "Choose The Integration Surface" -->

## Security Invariants

### A. Spec MUSTs — non-negotiable

1. **Validate the `Origin` header and answer `403`.** "Servers **MUST** validate the `Origin`
   header on all incoming connections to prevent DNS rebinding attacks… If the `Origin` header
   is present and invalid, servers **MUST** respond with HTTP 403 Forbidden." This — not the
   loopback bind — is the DNS-rebinding control. <!-- [SPEC:transports] Security Warning -->
2. **Never accept a token that was not issued for this server.** "MCP servers **MUST NOT**
   accept any tokens that were not explicitly issued for the MCP server." A server that also
   calls an upstream API "**MUST NOT** pass through the token it received from the MCP client"
   — that is a separate token from a separate authorization server. <!-- [SPEC:security] Token
   Passthrough; [SPEC:authz] Access Token Privilege Restriction -->
3. **Treat any URL-fetching capability as an SSRF surface.** The spec's normative text covers
   OAuth-related URL fetching — "MCP clients deployed to a server **MUST** consider SSRF risks
   and implement appropriate mitigations when fetching OAuth-related URLs" — and prescribes
   (as **SHOULD**s): block `10.0.0.0/8`,
   `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8` and `::1`, `169.254.0.0/16` (cloud
   metadata), `fc00::/7`, `fe80::/10`; apply the same validation to redirect targets ("Do not
   blindly follow redirects to internal resources"); and **do not hand-roll the check** —
   "Avoid implementing IP validation manually. Attackers exploit encoding tricks (octal, hex,
   IPv4-mapped IPv6) that custom parsers often miss." <!-- [SPEC:security] SSRF --> **This kit
   generalises that beyond OAuth discovery to any tool that fetches a caller-supplied URL**;
   the generalisation is our posture, the range list and the no-hand-rolling warning are the
   spec's. <!-- [STRAT] §2 -->

### B. Deployment invariants

Keep these true regardless of which server or transport is in play:

1. Bind the server (and any bridge in front of it) to loopback; do not publish its port to a
   public or LAN-reachable interface. The spec rates this a **SHOULD** — "when running
   locally, servers **SHOULD** bind only to localhost (127.0.0.1) rather than all network
   interfaces (0.0.0.0)" — i.e. defence in depth *behind* invariant A1, never a substitute
   for it. <!-- [KB] Security Invariants 1,3; [SPEC:transports] Security Warning -->
2. If remote/mobile access is needed, terminate it through a private, authenticated tunnel
   over HTTPS scoped to your own devices (e.g. a private mesh-network serve mode) — never a
   public-exposure mode of that same tool. <!-- [KB] Security Invariants 2 -->
3. An HTTP bridge (e.g. `mcpo`) stays private to its internal network; never publish its
   port directly to the host — and sandbox what it spawns. <!-- [KB] Security Invariants 3;
   [SPEC:security] "stdio Transport Security in Proxy Scenarios" -->
4. Mount any filesystem- or data-touching capability **read-only first**. Treat write
   access as a deliberate, later upgrade — not the default. <!-- [KB] Security Invariants 4 -->
5. Disable mutating functions at the adapter/bridge layer for a read-only-first server, so
   a write attempt is refused before it ever reaches the underlying resource. <!-- [KB]
   Security Invariants 5 -->
6. **A bearer token is a scoped simplification, not the auth story.** It is defensible for a
   personal, loopback-only deployment and this kit deliberately accepts it there. The 2026
   baseline for anything network-reachable is an OAuth 2.1 resource server: "A protected *MCP
   server* acts as an OAuth 2.1 resource server"; "MCP servers **MUST** implement OAuth 2.0
   Protected Resource Metadata (RFC9728)"; "MCP clients **MUST** implement Resource Indicators
   for OAuth 2.0 as defined in RFC 8707". Do not read the bearer guidance below as a general
   recommendation. <!-- [SPEC:authz] Roles, Overview §4, Resource Parameter Implementation;
   [STRAT] §2 -->
7. Bearer-auth hygiene: copy the API key **exactly**, including a trailing `=` — that is
   valid Base64 padding, not a copy artifact. A key truncated by one trailing character
   produces an HTTP `403` during tool execution, which reads like an authorization failure
   rather than a copy mistake — re-check the key character-for-character before assuming
   the server itself is misconfigured. <!-- [KB] "The trailing `=`..." + "API Key Copying"
   gotcha; [OPS] "Preserve a trailing `=`..." -->
8. Never print, paste into chat, or commit API keys or other MCP credentials. <!-- [OPS]
   "Protect The Invariants" -->

## Smoke Test

Run this three-step sequence in a fresh chat/session against the server before trusting it
with real use, and again after any config change: <!-- [KB] Smoke Test; [OPS] Smoke Test -->

1. **List-allowed** — ask the agent to list what the server exposes (allowed directories,
   resources, or scopes). Instruct it not to write or modify anything.
2. **Read** — ask it to read or list one real item inside that allowed scope. Instruct it
   not to write or modify anything.
3. **Attempt-write-must-refuse** — ask it to create, modify, or delete something. This
   request must be refused because no write-capable tool is exposed — not merely discouraged
   by instruction.

Expected result: step 1 returns only the intended scope, step 2 succeeds and returns real
content, step 3 fails because the capability genuinely does not exist server-side. If step 3
succeeds, the server is not actually read-only regardless of what its description claims —
treat that as a configuration defect, not a policy violation to note and move past.

If a call fails with `401`/`403`, re-enter the bearer key exactly (watch the trailing `=`)
and rerun the sequence before assuming a deeper fault. <!-- [KB] "API Key Copying"; [OPS]
Smoke Test troubleshooting note -->

## Pin The Tool Surface

Version pinning is not enough: a tool *description* can change inside a pinned version, and
the description is what steers the model. Hash each server's `tools/list` output — names,
descriptions, and input schemas — into a checked-in fixture, and **fail the smoke test when
the hash changes**. Re-read the diff and re-approve deliberately; never auto-accept.
<!-- [STRAT] §2 "Pin tool descriptions, not just versions" -->

Why this is the control and not paranoia: the spec itself notes that a server can change the
tools on offer mid-session — "If a particular server initiates server sent events as a
consequence of a tool call such as a `notifications/tools/list_changed`, where it is possible
to affect the tools that are offered by the server, a client could end up with tools that they
were not aware were enabled." <!-- [SPEC:security] Session Hijack Prompt Injection --> Scanners
in this space (Snyk Agent Scan, formerly Invariant Labs `mcp-scan`) detect "Tool Poisoning" and
"Tool Shadowing" against exactly this surface. <!-- [SCAN] --> The older instinct — read the
server's code and pin its version — is right but weaker; keep it, and add the hash.

## Extend Safely

- Add read-only capabilities first; prove them with the smoke test above before adding
  anything else. <!-- [KB] "Next Capability" -->
- When a write capability is genuinely needed, build one purpose-built, narrowly-scoped
  tool for that specific action (not a general write-capable filesystem or shell tool),
  with explicit user confirmation, input validation, idempotency, and a structured audit
  record of what it did. <!-- [KB] "Next Capability"; [OPS] "Extend Safely" -->
- Keep read-only integrations (e.g. calendar or mail reads) on a separate tool from any
  mutation-capable tool, so enabling one never silently grants the other. <!-- [OPS]
  "Extend Safely" -->
