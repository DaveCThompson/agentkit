---
name: tailscale
description: Local Tailscale CLI dependency for private Serve diagnosis and authorized route configuration. Version probing does not verify tailnet access.
check-command: tailscale version
doc-urls: [https://tailscale.com/docs/reference/tailscale-cli, https://tailscale.com/docs/reference/tailscale-cli/serve]
last-verified: 2026-09-07
---

# Tailscale CLI

This entry registers the real dependency declared by `tailscale-private-serve`. It adds no MCP
server, authentication or route configuration. Evidence: observed consumer method and primary CLI
documentation; staff-tier engineering judgment, Astra/high assignment.

Doctor runs `tailscale version` from each declaring project's directory. The ordinary version
command prints local client version information; it does not request an upstream version or
daemon status. See the [CLI version reference](https://tailscale.com/docs/reference/tailscale-cli#version).
Success establishes command execution, not login, daemon readiness, private exposure, ACL/grant
coverage, listener identity or access from the affected device.

Resolve the executable from PATH or a verified installed location. Doctor's fixed PATH probe
does not discover alternate Windows installation paths; report a successful explicit-path probe
separately if needed. Use the installed help for supported status and Serve syntax.

[Tailscale Private Serve](../.agent/skills/tailscale-private-serve/SKILL.md) owns Windows listener,
Serve/Funnel, route ownership, targeted rollback and remote-device verification. Use that method
only for the requested mode and target. A failed probe does not authorize installation, elevation,
login, public exposure or route changes. Necessary setup can proceed through its owner when an
existing grant covers it; otherwise use supplied redacted diagnostic evidence and retain the
unverified boundary. See [dependency semantics](../governance/best-practices.md#dependencies-and-capability-evidence).
