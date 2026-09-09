---
name: tailscale-private-serve
description: Use when configuring or diagnosing tailnet-only HTTPS access to a local service through Tailscale Serve on Windows, including listener identity and route reachability.
tier: kind:agent-infra
required-tools: [tailscale]
---

# Tailscale Private Serve

## When to use

Use for private browser/PWA access to an intended Windows-hosted service. Choose diagnosis or
authorized configuration from the request. A missing route in a diagnosis is a finding, not
permission to create it, change a base URL or restart a service. Existing action/target grants
carry through under `pattern-external-mutation.md`.

## Guardrails

- Serve provides tailnet access; Funnel provides public internet access. Keep the intended
  service private. Do not turn on Funnel or public/LAN binding to resolve connectivity.
- Verify the actual listener address, port and process identity. A successful localhost request
  does not prove exclusive loopback binding or that the intended service answered.
- Preserve unrelated Serve/Funnel routes. If the intended route is publicly exposed, report it
  and correct it only within the authorized target. An unrelated Funnel service is not authority
  to disable or reset the host's configuration.
- Scope access by the actual tailnet grants/ACLs and service authentication. Membership alone
  does not prove access is limited to the operator's own devices.
- Changes to grants/ACLs, DNS, HTTPS enablement, public exposure or another service require authority
  covering that change. Do not repeat an approval already granted for the same action/target.

## Verify the current route

Use an available shell and installed Tailscale CLI. Try ordinary read-only access first; seek
required elevation only if a permission error prevents a needed check and the runtime permits it.
Resolve the executable from PATH or verify its installed location, rather than assuming one path:

```powershell
$tsExe = (Get-Command tailscale.exe -ErrorAction Stop).Source
& $tsExe version
& $tsExe status --json
& $tsExe serve status
& $tsExe funnel status
& $tsExe serve --help
```

Inspect each command's result/exit before relying on it. Use the installed version's help for
supported flags and status formats. Record the backend state and the intended hostname,
HTTPS port, mount path and backend target. Check for overlapping routes and public exposure
on that same listener. Keep private hostnames and configuration evidence out of published files.

For the verified service port, inspect listeners and owning processes. In this diagnostic snippet,
`$servicePort` is an integer discovered from the service's actual configuration:

```powershell
$listeners = Get-NetTCPConnection -State Listen -LocalPort $servicePort -ErrorAction Stop
$listeners | Select-Object LocalAddress, LocalPort, OwningProcess
$listeners.OwningProcess | Sort-Object -Unique | ForEach-Object {
  Get-Process -Id $_ -ErrorAction Stop | Select-Object Id, ProcessName, Path
}
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:$servicePort/" -TimeoutSec 5
```

Check all returned addresses, including IPv6. Wildcard (`0.0.0.0`/`::`), LAN or tailnet bindings
are not exclusive loopback. Correlate the executable/service identity and expected health response;
authentication challenges may be expected on a protected root endpoint. Use a documented safe
health endpoint when available. If a container publishes the service, inspect its host binding
and approved private backend path too. Do not print process command lines that may contain secrets.

## Configure Serve

Proceed when configuration of the identified route is authorized and prerequisites are satisfied.
Capture its previous state, the exact proposed route delta and a targeted rollback. A new route's
rollback removes that route; a replacement restores the captured target/flags. Preserve other
routes and reconcile unexpected changes before writing. Do not use host-wide `serve reset`.

For a verified free/owned HTTPS listener and an application that supports the selected mount
path, the following shape enables a persistent proxy. `$httpsPort`, `$mountPath` and `$servicePort`
are resolved task values, not guessed defaults:

```powershell
& $tsExe serve --bg --https=$httpsPort --set-path=$mountPath "http://127.0.0.1:$servicePort"
& $tsExe serve status
& $tsExe funnel status
```

Check the mutation's exit/result before subsequent verification. Do not suppress an interactive
prompt that proposes a broader settings or exposure change. If the installed version requires
HTTPS/DNS setup not covered by the request, finish the read-only diagnosis and identify that
specific prerequisite. Path-mounted apps may need routing/asset support; choose a compatible
route instead of assuming every service works under an arbitrary prefix.

Record the reported `https://<host>.<tailnet>.ts.net` URL, including the chosen port/path when
applicable. Other devices must use that service URL, not their own `localhost`. Change the app's
external/base URL only when the application requires it and the request covers that configuration.
Restart only the identified service when necessary to apply the authorized change.

For a newly added route, the current CLI supports targeted removal with the original flags and
`off`; consult the installed help before applying the recorded rollback:

```powershell
& $tsExe serve --bg --https=$httpsPort --set-path=$mountPath off
```

A replaced route needs its captured prior target restored, not merely removal. Re-read status
before rollback so concurrent owners' changes are not overwritten. See the [Serve CLI](https://tailscale.com/docs/reference/tailscale-cli/serve)
for version-specific port/path targeting and disable semantics.

## Diagnose the failing boundary

Use the checks that distinguish the observed failure:

- Service unavailable locally: inspect listener/process and safe health evidence before changing Serve.
- Wrong route/response: compare intended host, port/path and backend with actual Serve/Funnel state.
- Peer unreachable: use `tailscale status`, `tailscale netcheck` and `tailscale ping <peer>` as
  appropriate. Peer reachability does not establish HTTPS or application access.
- HTTPS/name/auth problem: inspect certificate/name resolution, route and relevant redacted errors.
  Do not disable certificate or application authentication checks to make the request succeed.
- Device-specific browser/PWA failure: open the intended HTTPS URL on the affected device and
  inspect that response. Consider stale PWA/cache behavior after verifying the network path;
  do not clear user storage as a routine diagnostic step.

If the affected device is unavailable, report local success and remote verification pending.
If shell/Tailscale access is unavailable, request the relevant read-only commands and redacted
outputs from the operator. Missing CLI access does not authorize installation, elevation or
configuration elsewhere.

## Definition of done

The diagnosis identifies the observed failing boundary or an explicit evidence limit. Authorized
configuration changes only the owned route and necessary service settings, retains a targeted
rollback, and rechecks listener, Serve/Funnel state and local response. End-to-end access is
verified on the affected device or remains pending. State each result separately.

## References

- [Tailscale Serve](https://tailscale.com/docs/features/tailscale-serve) — private ingress and access controls.
- [Serve CLI](https://tailscale.com/docs/reference/tailscale-cli/serve) — flags, status and targeted changes.
- [Tailscale CLI](https://tailscale.com/docs/reference/tailscale-cli) — available diagnostics.
- [Tailscale Funnel](https://tailscale.com/docs/features/tailscale-funnel) — distinguish public exposure.
