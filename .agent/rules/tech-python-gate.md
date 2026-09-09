---
trigger: always
tier: tech:python
domain: testing
---

# Python Verification Gate

Use the Python project's actual tooling, dependency and deployment contract. This rule supplies
conditional Python mechanics; `foundation-testing.md` owns evidence and lifecycle gates.
Selecting the Python stack does not mandate uv, Ruff, a particular type checker or an MCP service.

## 1. The One-Command Gate — Python/uv Specifics

Prefer existing project commands that preserve true exits. If uv/Ruff/pytest are already configured,
typical checks are `uv run ruff check .`, `uv run ruff format --check .` and `uv run pytest -q`.
Run the selected type checker only when applicable. These are examples to inspect, not commands
to invent or an instruction to install missing tools.

- uv run may lock/sync, download dependencies/interpreters or write caches. `--locked` rejects
  stale lock metadata but can still sync the environment; `--frozen` skips freshness validation;
  `--no-sync` skips environment synchronization and therefore does not prove freshness.
  Use a prepared environment and permitted flags when writes/installations are outside scope.
  See [uv locking/syncing](https://docs.astral.sh/uv/concepts/projects/sync/).
- Use the existing dependency/lock format and owner. Pyproject, requirements files and script
  metadata serve different supported workflows; do not convert them merely to satisfy this rule.
  For an authorized uv project/script, preserve its generated lock and exact CI contract.
- An existing task runner, Make target or plain aggregate script is valid. A new `gate.py` is
  optional, not required infrastructure. Installed console entry points depend on package setup.
- Ruff lint and format-check are separate; formatter success does not prove lint/import sorting.
  Inspect enabled lint rules and formatter compatibility. Existing Black/isort/other tooling
  remains valid when the project intentionally uses it; avoid competing formatters for one file.
  See [Ruff formatter](https://docs.astral.sh/ruff/formatter/).
- Choose mypy, Pyright, ty or another checker from the supported project policy/version, diagnostic
  needs and environment cost. Inspect its runtime/download behavior; a tool name is not proof of
  stability and a historical beta label is not a permanent prohibition.

<a id="2-run-the-suite-on-linux-in-ci--a-correctness-requirement-not-hygiene"></a>

## 2. Verify the actual deployment platforms

For Linux deployments, relevant filesystem/permission proof needs Linux runtime coverage. For
other supported platforms, choose the actual target matrix. Local tests remain useful bounded
evidence; they do not prove another operating system's semantics.

Path/security fixtures can pass vacuously if the hostile case was never constructed. Verify
symlink/junction creation and collection, inspect skipped tests and reasons, and exercise meaningful
allowed/denied inputs. Windows privilege/developer-mode and filesystem settings can affect link
creation; do not assume it always fails. Case behavior depends on filesystem and configuration,
not OS name alone. Include drive-relative, UNC, case and canonicalization cases where supported.
A CI `runs-on` string alone does not establish the container, mount or process identity used.

<a id="3-test-security-logic-as-pure-functions"></a>

## 3. Test pure decisions and integration boundaries

Keep deterministic parsing/decision logic directly testable when that represents its contract.
Use parametrized hostile-input and legitimate-use cases with meaningful expectations.
Filesystem permissions, races, transport identity and dispatch enforcement also require integration
proof; not every authorization decision is pure. Do not extract production architecture for a
test-only assignment or mistake a pure predicate pass for service enforcement.

## 4. Canonicalize Before Comparing

For containment checks on existing paths, resolve both root and candidate before a component-aware
comparison such as `is_relative_to`. That method alone is lexical and does not interpret `..`.
A string prefix can accept a sibling such as `root-evil`; normalization alone does not resolve
symlink meaning. See [pathlib](https://docs.python.org/3/library/pathlib.html).

This example checks an existing path under a stable filesystem; it does not open it:

```python
from pathlib import Path

def contained_existing(root: Path, candidate: Path) -> bool:
    try:
        resolved_root = root.resolve(strict=True)
        resolved_candidate = candidate.resolve(strict=True)
    except (OSError, RuntimeError, ValueError):
        return False
    return resolved_candidate.is_relative_to(resolved_root)
```

Resolve relative user input against its intended root before this call, rather than an accidental
cwd. Decide whether absolute input and the root itself are allowed. Nonexistent targets need a
separate creation policy. A resolve-then-open sequence has a time-of-check/time-of-use race when
an attacker can replace path components; use platform-appropriate handle/descriptor-relative
enforcement and permissions for that threat, not this predicate as a sandbox.
Searches for `startswith` or `abspath` locate candidates, not universally defective code.

## 5. Prove a Read-Only Surface at Three Layers

For a service that promises read-only access, examine the exposed tool/endpoint surface, dispatch
and backing-resource enforcement. Tool-list absence or a “read-only” annotation alone does not
deny a reachable mutator. Code may legitimately write logs/caches outside protected content;
a package-wide ban on all write syscalls is not the scoped property.

Compare intended read-only mounts/roles with the effective runtime. A declaration test proves
configuration, not deployed enforcement. Use `kind-service-containers.md` for relevant hardening.
For denial tests, use explicitly disposable isolated fixtures and inspect state afterward, including
after timeout or unexpected success. Never remove protections or test writes against real user
data to generate red proof. Preserve allowed-use cases and evidence limits per
`foundation-testing.md`; no fixed number of tests or failing runs establishes every layer.

## 6. On stdio Transport, stdout Is JSON-RPC Only

For MCP stdio, preserve the implemented protocol revision's message framing; stdout is reserved
for protocol messages and diagnostics belong on stderr. See the
[MCP stdio transport](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports).
Other CLI/transport modes can have different output contracts.

Test an actual initialized protocol session, not just whether each line is syntactically JSON.
Search for stdout contamination, including imported-library output; a grep for `print` is only
a candidate scan. Choose redacted logs under the project's policy. Do not require resolved private
paths or a structured audit record on every invocation if that leaks data or adds unrelated scope.

<a id="7-pin-every-external-artifact-by-immutable-identity"></a>

## 7. Reproducible artifacts and compatible updates

Use reproducible artifact identities where deployment/supply-chain requirements need them:
container digests, action commit SHAs and exact resolved application dependencies are distinct
mechanisms. A major upper bound is a compatibility constraint, not an immutable dependency pin.
Libraries may intentionally declare supported ranges and test them; applications often deploy
from a lock. Do not impose stale example versions or universal package bounds.

Plan compatible, reviewed updates under the project's change/verification policy. An isolated bump
can improve attribution; coupled source/dependency changes may belong together. Dedicated commits
or manual merging are not universal proof requirements or authority to manipulate Git.
Follow `kind-service-containers.md` and `git-protocol.md` where applicable.

## 8. Explicitly Not Asserted

- No required dependency manager, type checker, environment runner or permanent ban based on
  an old release status. Verify the installed/selected tool's actual supported behavior.
- No mandatory source layout for a single-file tool; preserve actual import and test collection.
- No kit-wide coverage percentage. Existing coverage requirements remain binding, alongside
  meaningful property tests and explicit excluded/skipped outcomes.
- No universal ban on an OS/Python matrix or tox/nox. Test the supported runtime contract with
  the existing orchestration, without adding an unnecessary second environment owner.

## Sources

Primary semantics are linked at their point of use. Check the installed versions and implemented
protocol revision before applying examples. Retrieval is not a runtime gate, and a missing tool,
unsupported OS or unexecuted service fixture remains a named evidence gap.
