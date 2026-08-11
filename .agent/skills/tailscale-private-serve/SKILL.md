---
name: tailscale-private-serve
description: Configure and diagnose tailnet-only HTTPS access to a local personal service using Tailscale Serve on Windows. Use when enabling PC or phone browser/PWA access, checking Serve status, confirming the proxy targets the intended loopback port, troubleshooting tailnet reachability, or verifying that Funnel and public exposure remain disabled.
tier: kind:agent-infra
---

# Tailscale Private Serve

<!--
Graduated from a predecessor kit/.agent/skills/tailscale-private-serve/SKILL.md (a project-tier
overlay skill) per TICKET-akit-p4-agent-infra-pack.md Scope 2. That source is the sole
authority for every claim below; project-specific service names, ports, compose files, and
`doctor.ps1` references have been stripped. The bundled references/scripts/agents subfiles
were deliberately NOT carried over — see the P4 report for why (non-frontmatter sibling files
default to `tier: core` under the current selection engine and would ship to every repo
regardless of kind gating).
-->

Keep a personal service reachable from your own tailnet devices without exposing it to the
public internet.

## Guardrails

- Use Tailscale Serve, never Funnel, for a personal service. Funnel adds public internet
  exposure; Serve stays tailnet-only.
- Keep the service's listener bound to loopback (`127.0.0.1`) on the host; Serve should be the
  only thing terminating tailnet traffic in front of it.
- Proxy Serve to the service's actual local port — confirm the real port before wiring Serve,
  don't assume a default.
- Use the generated `https://<host>.<tailnet>.ts.net` URL for browser and PWA access from other
  tailnet devices; never a raw tailnet IP and never `localhost` from a remote device.
- Do not change ACLs, grants, DNS, HTTPS settings, or public exposure without explicit user
  approval — this skill diagnoses and configures Serve only, nothing broader in the tailnet.

## Verify The Current Route

Tailscale CLI status/serve queries can require an elevated PowerShell prompt on Windows even
for read-only checks against the local service pipe:

```powershell
& "C:\Program Files\Tailscale\tailscale.exe" status --json
& "C:\Program Files\Tailscale\tailscale.exe" serve status
& "C:\Program Files\Tailscale\tailscale.exe" funnel status
```

Confirm: the backend is running, Serve reports a route to the expected local port, and Funnel
reports no active configuration (or explicitly "tailnet only"). A Funnel route serving a
non-tailnet-only `https://` URL is a policy violation for this pattern — treat it as a finding
to fix, not a config choice to leave alone.

Then confirm the service itself answers on loopback:

```powershell
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:<local-port>/" -TimeoutSec 5
```

## Configure Serve

Run from an elevated PowerShell prompt only when the route is missing or needs to be replaced:

```powershell
& "C:\Program Files\Tailscale\tailscale.exe" serve --bg <local-port>
& "C:\Program Files\Tailscale\tailscale.exe" serve status
```

Record the reported `https://...ts.net` URL wherever the service reads its own public/base URL
from (an env var, a config file, etc.), then restart or recreate the service if it needs to pick
up that change.

## Diagnose In Order

1. `tailscale status` — confirm the backend is running and the device is on the tailnet.
2. `tailscale netcheck` — confirm network conditions aren't blocking connectivity.
3. `tailscale ping <peer>` — when one tailnet device can't reach another.
4. `tailscale serve status` — confirm the route and its target port.
5. Check the service's own health or root endpoint on `127.0.0.1:<local-port>` from the host.
6. Open the Serve HTTPS URL from the affected desktop or phone.

If shell access is unavailable, ask the user to run these read-only commands and share the
output.

## References

- [Tailscale Serve](https://tailscale.com/docs/features/tailscale-serve)
- [Serve CLI](https://tailscale.com/kb/1242/tailscale-serve)
- [Tailscale CLI](https://tailscale.com/kb/1080/cli)
- [Tailscale Funnel](https://tailscale.com/docs/features/tailscale-funnel) — intentionally not
  used by this pattern; Funnel exposes a service to the public internet.
