---
trigger: model-decision
description: Consult when authoring or reviewing a container service definition (Compose/stack file) — digest pinning, read-only rootfs, capability drops, non-root user, secrets over env/argv, read-only mounts, healthchecks and start ordering, schema validation, and digest-bump automation.
tier: kind:service
domain: security
---

# Container Service Hardening

<!--
Sources (cite-or-run — every load-bearing claim below traces to one of these):
  [C:services] Compose file reference, services  — https://docs.docker.com/reference/compose-file/services/ (fetched 2026-07-25)
  [C:version]  Compose version and name          — https://docs.docker.com/reference/compose-file/version-and-name/ (fetched 2026-07-25)
  [C:secrets]  Use secrets in Compose            — https://docs.docker.com/compose/how-tos/use-secrets/ (fetched 2026-07-25)
  [C:config]   docker compose config             — https://docs.docker.com/reference/cli/docker/compose/config/ (fetched 2026-07-25)
  [D:run]      docker container run reference    — https://docs.docker.com/reference/cli/docker/container/run/ (fetched 2026-07-25)
  [D:caps]     Runtime privilege & capabilities  — https://docs.docker.com/engine/containers/run/ (fetched 2026-07-25)
  [D:pull]     docker image pull                 — https://docs.docker.com/reference/cli/docker/image/pull/ (fetched 2026-07-25)
  [D:manifest] docker manifest inspect           — https://docs.docker.com/reference/cli/docker/manifest/inspect/ (fetched 2026-07-25)
  [D:file]     Dockerfile reference, CMD/ENTRYPOINT interaction — https://docs.docker.com/reference/dockerfile/ (fetched 2026-07-25)
  [REG]        Registry HTTP API V2              — https://distribution.github.io/distribution/spec/api/ (fetched 2026-07-25)
  [RN:docker]  Renovate docker presets           — https://docs.renovatebot.com/presets-docker/ (fetched 2026-07-25)
  [RN:helpers] Renovate helpers presets          — https://docs.renovatebot.com/presets-helpers/ (fetched 2026-07-25)
  [RN:age]     Renovate minimumReleaseAge        — https://docs.renovatebot.com/configuration-options/#minimumreleaseage (fetched 2026-07-25)
  Worked evidence (a real stack where §1–§11 were applied, including two deliberate declines):
  the operate-side kit/docs/knowledge-base/spec/SPEC-runtime-hardening.md §1–§2, and the two compose
  files under the operate-side kit/runtime/ that implement it.
-->

A service repo's real attack surface is the container it ships, not only the code inside it. Harden
at the kernel boundary — read-only rootfs, dropped capabilities, a non-root UID, secrets delivered as
mounted files — so the guarantee is **externally auditable** (`docker inspect`, `docker compose
config`) instead of asserted by the application. Every assertion below carries a check; a hardening
claim you cannot demonstrate failing is a preference, not a control.

Applies to any container service definition, whatever the file is called — a file passed with `-f`
need not use a default `compose.yaml`/`docker-compose.yml` name.

## 1. Verify Before You Harden — And Record Every Decline

This section governs the nine that follow. Apply it first.

- **A hardening setting that breaks the service is worse than none.** A stack that will not come up
  gets reverted wholesale, and the settings that *were* safe are lost with it.
- **Read the image before you constrain it.** Its Dockerfile (does it set `USER`, or is non-root a
  *build-time* `--build-arg`?), its entrypoint, and its true write paths — caches outside the
  documented data volume, upload temp dirs, runtime plugin/package installs — decide which of §3–§5
  are safe for *that* service. Assumption is not verification: cite the file you read.
- **Declining is a legitimate outcome; a silent decline is not.** When a setting is unsafe for a
  service, leave it off and write a comment beside the service naming the evidence, the concrete
  failure it would cause, and the condition under which it should be revisited (e.g. "revisit if this
  repo builds its own image with a non-root UID baked in at build time").
- **Never describe a partial fix as complete.** Where the clean fix does not exist upstream,
  implement the closest real improvement, then record the residual gap in the same comment and name
  the upstream change that would close it. "Reduced blast radius" and "closed" are different words.
- **Sequence by value.** Harden first the service whose entire purpose is to be constrained — a
  read-only bridge, an adapter, a sidecar with data access. Kernel enforcement buys the most there.
- **Check:** for every service, each of `read_only`, `user`, `cap_drop` is either present or has an
  adjacent comment explaining its absence. A `grep -n 'read_only\|user:\|cap_drop' <file>` that comes
  up short with no neighbouring rationale is a review failure.

## 2. Pin Every Image By Digest, Keeping The Tag

- **Write `image: repo:tag@sha256:…`** — the tag stays for human readability, the digest is what
  actually resolves. Pinning "'pins' an image to a specific version in time. Docker does therefore
  not pull updated versions of an image, which may include security updates" <!-- [D:pull] --> — that
  is the point, and it is why §11 is not optional. Tags are mutable; a digest is not.
- Compose documents the image format as `[<registry>/][<project>/]<image>[:<tag>|@<digest>]`
  <!-- [C:services] -->. The combined tag+digest form is accepted by the reference grammar and the
  digest wins when both are present; if some toolchain in your path rejects the combined form, keep
  the digest and move the tag into a comment. Never drop the digest to keep the tag.
- **Resolve the digest from the registry, with no daemon and no pull**, by reading the
  `Docker-Content-Digest` response header from a manifest request — "any response may include a
  `Docker-Content-Digest` header… the digest of the target entity returned in the response", on
  `GET /v2/<name>/manifests/<reference>` where the reference "may include a tag or digest"
  <!-- [REG] -->:

  ```sh
  # Token step is registry-specific; public repos on some registries need none.
  TOKEN=$(curl -s "https://<registry>/token?scope=repository:<project>/<image>:pull" \
    | sed -E 's/.*"token":"([^"]+)".*/\1/')
  curl -s -D - -o /dev/null \
    -H "Authorization: Bearer $TOKEN" \
    -H "Accept: application/vnd.oci.image.index.v1+json" \
    https://<registry>/v2/<project>/<image>/manifests/<tag>
  # -> docker-content-digest: sha256:…
  ```

  Send an `Accept` header listing the manifest types you accept — the registry returns the type it
  chose, and a different manifest type is a different digest <!-- [REG] -->. With a working daemon,
  `docker manifest inspect --verbose <ref>` is the equivalent (documented as an **experimental**
  command <!-- [D:manifest] -->).
- **Never hand-type or hand-edit a digest.** Copy it from one of those two outputs, for the exact tag
  you intend. A transposed character fails at pull time; a *plausible* wrong digest is worse.
- **Check:** `docker compose config --images` <!-- [C:config] --> — every line contains `@sha256:`.
  Grepping `image:` in the source file is the pre-commit form of the same check.

## 3. `read_only: true`, With `tmpfs` For Scratch

- `read_only` "configures the service container to be created with a read-only filesystem"
  <!-- [C:services] -->; the engine flag "prohibit[s] writes to locations other than the specified
  volumes for the container" <!-- [D:run] -->. Set it on every service that does not need a writable
  rootfs — which, after §1's read of the image, is most of them.
- **Give back exactly the scratch space the process needs** with `tmpfs`, which "mounts a temporary
  file system inside the container" <!-- [C:services] -->, sized and moded explicitly
  (e.g. `- /tmp:size=128m,mode=1777`).
- **Repoint the process at that scratch space.** A runtime that expects a writable `HOME`, a package
  cache, or a bytecode cache will fail at start against a read-only rootfs unless the corresponding
  environment variables point into the tmpfs. Enumerate those paths from §1's read; do not discover
  them by outage.
- **Check:** `docker inspect -f '{{.HostConfig.ReadonlyRootfs}}' <container>` prints `true`, **and**
  the service's normal write path is exercised once after `up` without a permission error. The
  inspect check alone proves the setting, not that the service survives it.

## 4. `cap_drop: [ALL]`, Plus `no-new-privileges`

- `cap_drop` "specifies container capabilities to drop as strings" <!-- [C:services] -->, and `ALL`
  is an accepted value for the capability flags — the engine's own example composes them as
  `--cap-add=ALL --cap-drop=MKNOD` <!-- [D:caps] -->. Drop everything, then add back only the named
  capabilities the service demonstrably needs (a process binding a port below 1024 needs
  `NET_BIND_SERVICE`; a plain web listener on an unprivileged port typically needs none, which makes
  `cap_drop: [ALL]` unconditionally safe there).
- **Add `security_opt: ["no-new-privileges:true"]`.** It "disable[s] container processes from gaining
  new privileges… commands that raise privileges such as `su` or `sudo` no longer work"
  <!-- [D:run] -->. Compose accepts either `option=value` or `option:value` <!-- [C:services] -->.
  This is what makes §5's non-root UID a one-way door rather than a suggestion.
- **Check:** `docker inspect -f '{{.HostConfig.CapDrop}} {{.HostConfig.CapAdd}} {{.HostConfig.SecurityOpt}}'`
  shows `[ALL]`, the justified add-backs, and `no-new-privileges`. Red-proof it once: remove a needed
  add-back and confirm the service actually fails — a control that has only ever printed green is not
  a control.

## 5. Non-Root `user:` — After Confirming The Image And The Mounts

- With neither a Dockerfile `USER` nor a Compose `user:`, the container runs as **root**: `user`
  "overrides the user used to run the container process. The default is set by the image, for example
  Dockerfile `USER`. If it's not set, then `root`" <!-- [C:services] -->.
- **Prefer an image that bakes a non-root `USER`.** A Compose-level `user:` override on an image
  built for root can bypass ownership setup that the image's own entrypoint performs for its
  *build-time* UID, producing permission-denied at start rather than a warning. When an image's
  non-root support is a build-time argument, the real fix is building the image — say so and decline
  the override (§1) rather than shipping a stack that will not start.
- Where an override *is* safe, an arbitrary non-root UID on a root-built image is still strictly
  better than root: paired with §4 it cannot regain root even if a later image layer adds a setuid
  binary. State that reasoning in the comment so the next reader knows it was a judgement, not a copy.
- **Windows-host trap.** Bind mounts from a Windows host carry no Unix permission bits of their own;
  the file-sharing layer presents them under its own mapping. A container that read a bind mount fine
  as root can hit permission-denied as a non-root UID. Never add `user:` to a service with host bind
  mounts on that setup without a live `up` proving the mounts are still readable — and if you cannot
  run the stack, say the check was not run instead of implying it passed.
- **Check:** `docker inspect -f '{{.Config.User}}' <container>` is non-empty and not `0`/`root`, and
  `docker exec <container> id -u` returns non-zero — the second catches an override the image's
  entrypoint silently undid.

## 6. No Secret In `command:` Or `environment:` — Use Compose Secrets

- Docker's own rationale for preferring secrets over environment variables: "Environment variables
  are often available to all processes, and it can be difficult to track access. They can also be
  printed in logs when debugging errors without your knowledge." <!-- [C:secrets] --> A secret in
  `command:` is worse still — it lands in the process argv table *and* in `docker inspect`.
- **Use a top-level `secrets:` entry with a `file:` source** and grant it per service. "Secrets are
  mounted as a file in `/run/secrets/<secret_name>` inside the container" <!-- [C:secrets] -->. The
  source file must be git-ignored; generate its contents with a CSPRNG.
- **`healthcheck.test` is recorded exactly like `command:`.** Putting a credential in a probe
  relocates the leak, it does not fix it (§8).
- **When upstream offers no clean path, improve what you can and record the rest.** If the program
  has no environment-variable or file option for its credential — *verified by reading its CLI or
  source, not assumed* — deliver the secret as a Compose secret file and have an entrypoint read it
  at container start. That removes the value from the tracked file, from `docker compose config`
  output, and from `docker inspect`. It does **not** remove it from the running process's own argv,
  still visible inside the container's PID namespace and via `docker top`. Write that residual next
  to the workaround, name the upstream change that would close it, and do not report the item done.
- If such a shim is needed, override `entrypoint:`, not just `command:`: arguments are **appended**
  to an exec-form `ENTRYPOINT` rather than replacing it — `ENTRYPOINT ["exec_entry","p1_entry"]` plus
  `CMD ["exec_cmd","p1_cmd"]` runs `exec_entry p1_entry exec_cmd p1_cmd` <!-- [D:file] -->.
- **Check:** the secret's value appears in none of `git grep -F "<value>"`, `docker compose config`,
  or `docker inspect -f '{{json .Config.Cmd}}{{json .Config.Env}}{{json .Config.Healthcheck}}'`; the
  secret source file is matched by `.gitignore`.

## 7. Mounts Read-Only And Content-Only; Named Volumes For Writes

- Every bind mount that supplies configuration or content gets `:ro`. Anything the service must
  *write* goes to a named volume, never back into a host content directory. This bounds what a
  compromised container can reach on the host — and it is the mount posture §3 and §5 assume.
- **Check:** every `volumes:` bind entry in `docker compose config` ends in `:ro`, or is a named
  volume declared in the top-level `volumes:` block. `docker inspect -f '{{json .Mounts}}'` shows
  `"RW": false` for each bind.

## 8. Healthcheck Every Service; Gate Start Order On It

- `healthcheck` "declares a check that's run to determine whether or not the service containers are
  'healthy'" <!-- [C:services] -->. Give one to every service, including services nothing depends on
  yet — a future dependent needs something to key off.
- **Where order matters, use the long `depends_on` syntax with `condition: service_healthy`**, which
  "specifies that a dependency is expected to be 'healthy' before starting" <!-- [C:services] -->.
  Short-form `depends_on` gives you `service_started` semantics only, so a dependent will happily
  come up against a process that is running but not yet ready.
- **Probe liveness, not authorization.** The probe must carry no credential (§6). Any response —
  including `401` — proves the process is listening; assert authentication *behaviour* in a separate
  test, not in the liveness probe.
- **Check:** `docker compose ps` reports `healthy` for each service;
  `docker inspect -f '{{.State.Health.Status}}' <container>` is `healthy`; every service block in
  `docker compose config` contains a `healthcheck` key.

## 9. No Top-Level `version:`

- "The top-level `version` property is defined by the Compose Specification for backward
  compatibility… It is only informative and you'll receive a warning message that it is obsolete if
  used." Compose "always uses the most recent schema to validate the Compose file, regardless of the
  `version` field." <!-- [C:version] --> Delete it.
- **Check:** `grep -n '^version:' <file>` returns nothing, and §10's validation run emits no obsolete
  warning.

## 10. Validate The Definition Mechanically

- Run `docker compose -f <file> [-f <overlay>…] config -q` — `-q`/`--quiet` means "only validate the
  configuration, don't print anything", and the command "merges the Compose files set by `-f` flags,
  resolves variables in the Compose file, and expands short-notation into the canonical format"
  <!-- [C:config] -->. That catches malformed YAML, unresolved interpolation, and schema violations
  before anything is deployed. Wire it into whatever gate the repo already runs; this rule does not
  prescribe the gate's design.
- **Supply placeholder values for required variables** in that environment — never real secrets. A
  file using the required-variable form (`${VAR:?…}`) will otherwise fail the check for the wrong
  reason. `--no-interpolate` <!-- [C:config] --> is the escape hatch for a pure schema check.
- **On the "no daemon needed" claim:** the daemon- and registry-touching behaviours of this command
  are opt-in flags (`--resolve-image-digests`, `--lock-image-digests`) <!-- [C:config] -->, and plain
  `config -q` is documented purely as validation and rendering. The docs do not *state* that it runs
  without a running engine — treat that as something to confirm once in your own environment, not as
  a documented guarantee.

## 11. Automate The Digest Bump, With A Cooldown

Pinning is only sustainable if something opens the bump PR; a digest nobody bumps is a frozen, ageing
image, and §2 has then traded one risk for another.

- Adopt `docker:pinDigests` — "Pin Docker digests" <!-- [RN:docker] --> — and, for workflow files,
  `helpers:pinGitHubActionDigests` — "Pin `github-action` digests" <!-- [RN:helpers] -->. Note that
  `docker:pinDigests` disables digest pinning for a few managers (argocd, devcontainer, helmv3,
  pyenv) <!-- [RN:docker] -->; if the repo uses one of those, pin it another way.
- Add a cooldown so a compromised release is not adopted the day it lands: `minimumReleaseAge`,
  "await this long before creating a branch/PR, or before automerging" <!-- [RN:age] -->, e.g.
  `"3 days"`.
- **The human half stays human.** The bot opens the PR; a person merges it *after* re-running the
  service's own verification. Do not automerge a digest bump.
- **Check:** the bot's config file exists, its `extends` contains both presets, and a
  `minimumReleaseAge` is set; the repository shows digest-bump PRs newer than the oldest pin.

## 12. Verification

- [ ] Every `image:` resolves with `@sha256:` (`docker compose config --images`).
- [ ] Every service sets `read_only: true`, or has a comment naming the verified reason it cannot.
- [ ] Every service sets `cap_drop: [ALL]` (+ justified add-backs) and `no-new-privileges:true`.
- [ ] Every service runs as a non-root UID, or has a comment naming the verified reason it cannot.
- [ ] No credential appears in `command:`, `environment:`, or `healthcheck.test`; secrets come from a
      git-ignored `file:` source mounted under `/run/secrets/`.
- [ ] Bind mounts are `:ro`; every writable path is a named volume.
- [ ] Every service has a `healthcheck`; every ordering dependency uses `condition: service_healthy`.
- [ ] No top-level `version:`.
- [ ] `docker compose … config -q` runs clean in the repo's gate.
- [ ] Digest-bump automation is configured with a cooldown, and merges are manual.
- [ ] Each declined setting and each partial fix carries a written residual note (§1).
