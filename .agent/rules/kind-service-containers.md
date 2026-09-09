---
trigger: model-decision
description: Consult when authoring or reviewing a container service definition (Compose/stack file) — digest pinning, read-only rootfs, capability drops, non-root user, secrets over env/argv, read-only mounts, healthchecks and start ordering, schema validation, and digest-bump automation.
tier: kind:service
domain: security
---

# Container Service Hardening

Harden the actual service boundary while preserving required behavior and authorized operations.
Read image/runtime evidence and verify effective controls; a YAML key is not deployed enforcement.
Use `foundation-security.md`, `pattern-external-mutation.md` and `foundation-testing.md`.

Applies to relevant container definitions, including non-default Compose filenames. The methods
below primarily describe Linux containers with Docker Compose; Windows containers, Swarm and other
orchestrators have different support. Inspect the selected platform/tool version before applying them.
Review is read-only. Starting containers, pulling images, changing secrets, modifying deployment or
running negative probes requires the corresponding action/target authority.

## 1. Verify Before You Harden — And Record Every Decline

- Read the image's Dockerfile, entrypoint, effective user and true write paths. Include caches,
  uploads, temporary files and startup initialization; a documented data volume may be incomplete.
- Prefer least privilege, read-only root filesystems and narrow mounted secrets where supported.
  Check availability and intended service behavior along with denial. A breaking change needs
  resolution, not an automatic choice between an outage and removing all controls.
- For relevant declined settings, record the verified incompatibility, residual risk and revisit
  condition beside the definition or in its existing security record. Distinguish reduced exposure
  from a closed boundary. Do not silently call a partial fix complete.
- Prioritize actual exposed/protected resources and services with restrictive access promises.
  A setting's presence/count alone does not determine priority.
- Check effective configuration, including image defaults and overlays: each material control is
  applied, justified as unnecessary, or explicitly limited. A grep for `user:` cannot see a valid
  image-level non-root user or establish the process's real privilege.

<a id="2-pin-every-image-by-digest-keeping-the-tag"></a>

## 2. Pin deployed image identities

For repeatable deployment, prefer a verified digest with a readable tag/comment and an update owner.
Tags are mutable. A digest identifies content, not publisher trust, vulnerability status or freshness.
Preserve an explicit local-development/build workflow instead of blindly pinning transient images.

- Resolve the intended registry/repository/tag and platform using the registry's authenticated
  manifest API or an installed image-inspection tool. A daemon/pull is not inherently needed for a
  registry manifest request; do not start a service merely to inspect identity.
- Follow the registry's actual authentication challenge/client rather than parsing token JSON
  with a regex. Keep credentials out of command arguments, logs and reports.
- Inspect HTTP success, content type and returned digest/body identity. Send supported manifest
  Accept types. Distinguish a multi-platform index digest from a child platform-manifest digest;
  record which will be deployed. Validate TLS/provenance and tool output, not a plausible hash.
- A `repo:tag@sha256:…` form retains readability where supported; the digest determines content.
  If a tool rejects the combined form, preserve the digest and place the tag in a comment.
- Check resolved image references from the exact Compose files/profiles/environment, for example
  `docker compose -f <file> config --images`. Build-only services need their actual produced
  artifact identity; an empty image list is not a pinning pass.

See [Docker image pull](https://docs.docker.com/reference/cli/docker/image/pull/) and the
[Registry manifest API](https://distribution.github.io/distribution/spec/api/).

## 3. `read_only: true`, With `tmpfs` For Scratch

Set a read-only root filesystem when compatible; mounted writable paths remain writable.
Provide only necessary scratch storage, with appropriate size/mode and lifetime. For Linux, a
`tmpfs` mount such as `/tmp:size=128m,mode=1777` is an example, not a universal budget.

Point runtime HOME/cache/bytecode/temp settings at intended writable locations when necessary;
do not repurpose unrelated host environment variables. Persist required data separately from
ephemeral scratch. Check memory/storage limits and startup writes before deployment.

For an authorized runtime check, inspect `HostConfig.ReadonlyRootfs` on the exact container,
then exercise legitimate writes and appropriate denial in isolated fixtures. Inspect alone proves
the configured flag, not application compatibility, immutability of volumes or a complete sandbox.

## 4. `cap_drop: [ALL]`, Plus `no-new-privileges`

For Linux containers, start from dropping unnecessary capabilities and add only demonstrated needs.
A web listener can still need startup/file/network capabilities unrelated to its listening port.
Low-port binding also depends on the namespace's `ip_unprivileged_port_start`; do not automatically
add `NET_BIND_SERVICE` or call ALL-drop unconditionally safe for every high-port service.

Use `security_opt: ["no-new-privileges:true"]` where supported to prevent gaining privileges
through exec mechanisms such as setuid/file capabilities. It does not remove already held privilege,
repair writable mounts or prove a process cannot access protected resources.

Inspect effective CapDrop/CapAdd/SecurityOpt and the relevant process context. Meaningful denial
tests belong in disposable isolated fixtures; do not remove a needed capability from a live service
just to manufacture a failing run. See
[Docker runtime privileges](https://docs.docker.com/engine/containers/run/) and
[Linux IP sysctls](https://docs.kernel.org/networking/ip-sysctl.html).

## 5. Non-Root `user:` — After Confirming The Image And The Mounts

An image without USER and without a runtime override defaults to root in the container. Prefer
supported non-root operation, but inspect initialization and whether an entrypoint later drops
privileges. A Compose override can bypass required ownership/setup behavior.

Where a safe override is possible, verify UID/GID, supplementary groups and access to all mounted
paths. A numeric non-zero UID is not proof of least privilege; capabilities, devices, user namespaces
and mounts also matter. Record a needed image/build change rather than shipping a broken override.

Docker Desktop/Windows bind-mount permissions depend on the actual backend and sharing layer.
Verify the target platform's mount access instead of assuming Unix permissions or impossibility.
Inspect Config.User and the identity/capabilities of the actual service process. An exec'd
`id -u` reports that new process, which may differ from a server whose entrypoint dropped privilege.
If runtime checks are unavailable, retain the deployment gap explicitly.

<a id="6-no-secret-in-command-or-environment--use-compose-secrets"></a>

## 6. Keep secrets out of exposed configuration

Do not put secret literals in tracked commands, health checks, environment definitions or rendered
evidence. Prefer supported mounted-secret/file APIs over argv and broad environment exposure.
Use the project's protected secret provider; Compose `secrets` with an ignored file source is one
option, not a required universal source. File permissions and host/runtime access still matter.

- Grant each secret only to intended services. For Compose file secrets, check the actual mount
  under `/run/secrets/<name>` and how the application reads it. Do not create/rotate credentials
  merely to perform a source audit.
- If the program only accepts argv, an entrypoint reading a mounted file can keep the value out of
  tracked/rendered configuration while leaving it exposed in process arguments. Inspect the actual
  launch behavior and record that residual; this is not a secret-safe interface.
- Preserve the existing entrypoint's setup, signal forwarding and exit behavior. An exec-form
  ENTRYPOINT appends command arguments; replacing `command` may not replace that executable.
  Override entrypoint only when the intended invocation and compatibility require it.
- A health check with a secret literal merely relocates the leak. Avoid credentialed probes when
  a non-sensitive endpoint can express the desired health property.
- Scan with synthetic markers in disposable configs or an approved redacting secret scanner.
  Never put a real secret into `git grep "<value>"` or expose full resolved config/inspect output
  to prove absence. Metadata inspection cannot establish absence from process memory or all logs.

See [Compose secrets](https://docs.docker.com/compose/how-tos/use-secrets/) and
[Dockerfile ENTRYPOINT/CMD](https://docs.docker.com/reference/dockerfile/).

<a id="7-mounts-read-only-and-content-only-named-volumes-for-writes"></a>

## 7. Scope read-only and writable mounts

Mount supplied content/configuration read-only when writes are not required. Give a service only
the intended subtree; avoid exposing unrelated host directories or sockets.
Writable named volumes, scoped bind mounts and tmpfs serve different legitimate needs. Select by
persistence, ownership, backup and deployment requirements rather than forbidding every writable bind.

Inspect normalized mount type/source/target/read_only and effective runtime `Mounts[].RW`.
Compose expands short notation, so rendered configuration need not end in the literal `:ro`.
Account for nested mounts and host-path creation behavior. A read-only rootfs does not make
writable binds safe, and a named volume is not automatically private to one service.

<a id="8-healthcheck-every-service-gate-start-order-on-it"></a>

## 8. Health signals and startup dependencies

Choose a useful liveness/readiness/completion signal for each relevant service. A batch job or
passive component need not invent an HTTP healthcheck. Preserve existing probes that actually
represent the intended service condition.

Where startup needs readiness, Compose long-form `depends_on` with `condition: service_healthy`
waits for the dependency's healthcheck. `service_completed_successfully` can fit a prerequisite job.
Short-form startup order does not establish readiness; neither ordering method replaces runtime
reconnection/failure handling or promises equivalent behavior in every orchestrator.

A listening HTTP endpoint returning 401 can establish reachability, not full readiness, authorization
correctness or a healthy dependency chain. Assert the response/property the probe really needs.
Keep probes bounded, non-destructive and non-sensitive; test auth behavior separately.

Check the exact service's health/completion result and dependent startup behavior under the target
orchestrator. Do not require every `ps` row to say healthy, or accept any HTTP response as health.
See [Compose services](https://docs.docker.com/reference/compose-file/services/).

<a id="9-no-top-level-version"></a>

## 9. Compose version compatibility

Modern Docker Compose treats the top-level version field as obsolete/informative; it does not
select a schema. Omit it for that toolchain. Preserve explicit compatibility needs of other
consumers until an authorized migration, rather than deleting it from any YAML with that spelling.
Check actual parser warnings and required consumers.
See [Compose version/name](https://docs.docker.com/reference/compose-file/version-and-name/).

## 10. Validate The Definition Mechanically

Use the actual installed validator with the exact file/overlay/profile set. For Compose,
`docker compose -f <file> config -q` validates without printing resolved configuration.
Capture stderr and true exit. Missing interpolation may warn and substitute an empty value;
schema validity alone does not prove required operational values or valid deployment.

Use non-secret placeholders for required variables in isolated validation. `--no-interpolate`
can narrow a check, but does not prove actual environment resolution. Flags resolving image digests
can access a registry; inspect effects before using them. Confirm needed daemon/registry behavior
for the installed version instead of assuming a validator also deployed or contacted the target.
See [Compose config](https://docs.docker.com/reference/cli/docker/compose/config/).

<a id="11-automate-the-digest-bump-with-a-cooldown"></a>

## 11. Maintain image pins

Assign a maintained update/review process so a pin does not silently freeze security fixes.
Existing automation is useful; configuring a new bot or GitHub integration needs its own authority.

For projects already using Renovate, `docker:pinDigests` and, where applicable,
`helpers:pinGitHubActionDigests` are candidate presets to inspect against current manager support.
Check the real generated PRs and covered images/actions rather than requiring both presets everywhere.
A cooldown such as `minimumReleaseAge` depends on available release-timestamp semantics; it cannot
certify safety and must not be assumed to delay every digest update. Urgent security updates may
need a different approved policy. See [Renovate configuration](https://docs.renovatebot.com/configuration-options/#minimumreleaseage).

Use the project's review/merge policy, including any approved automation and required service proof.
Do not mandate a person-only merge or a fixed delay for all deployments. Missing/unsupported bot
coverage needs an explicit maintenance owner, not a claim that a config file proves updates occur.

## 12. Verification

- [ ] Exact definition, image/platform identity and effective overlay/profile inputs identified.
- [ ] Relevant rootfs, user, capabilities, privilege-escalation and mount controls verified or limited.
- [ ] Secrets reach only intended consumers; metadata/argv/log exposure and exceptions assessed safely.
- [ ] Legitimate startup/read/write paths and scoped denials checked in authorized fixtures.
- [ ] Health/readiness/completion matches the actual workload and dependent behavior.
- [ ] Installed parser validates the definition; warnings and missing environment/runtime proof are retained.
- [ ] Pin-update coverage and its owner are real; automation configuration is not runtime proof.
- [ ] Declines/partial fixes retain their evidence, residual risk and next owner.
