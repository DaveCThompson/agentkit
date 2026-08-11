---
trigger: always
tier: tech:python
domain: testing
---

# Python Verification Gate

Python-stack repos build on uv + Ruff + pytest — this rule holds the Python-specific verification
mechanics that `foundation-testing.md` keeps neutral. Wherever that rule says "adapt to the
project's lint/typecheck/test/build equivalents", this is what that adaptation looks like for
Python; it is the sibling `foundation-testing.md` §1 points at for repos that are not `kind:app`.
`tier: tech:python` resolves against `.agentkit.json` `stack`, so this ships only where
`stack: ["python"]` is declared — no existing install changes.

## 1. The One-Command Gate — Python/uv Specifics
The Node convention's *shape* transfers; its mechanics do not. One prefix-matchable command per
tier, never a bespoke compound pipeline (`foundation-testing.md` §1, `pattern-command-shape.md` §1).

| Tier | Command |
| :--- | :--- |
| lint | `uv run ruff check .` |
| format | `uv run ruff format --check .` |
| types (optional) | `uv run pyright` |
| test | `uv run pytest -q` |
| aggregate | one `gate` entry point chaining the above, exiting non-zero on the first failure |

- **There is no `gate:*` equivalent to inherit — uv ships no task runner**, and `[project.scripts]`
  console entry points are created at *install* time, so they do not exist in a project that is not
  itself installed (`[tool.uv] package = false`). The portable aggregate with zero added dependency
  is a committed script invoked as `uv run gate.py`: one allowlistable head (`uv run …`), one
  process owning the true exit code, identical on Windows and Linux. `poethepoet` or a `Makefile`
  target is fine if the project already carries one; do not take a dependency solely to alias four
  commands.
- **Declare dependencies in `pyproject.toml`, or a PEP 723 `# /// script` header for a single-file
  tool — never a `requirements.txt`.** Commit the lockfile: `uv.lock` for a project, or the adjacent
  `<file>.lock` that `uv lock --script <file>` writes for a PEP 723 script. Install in CI with
  `uv sync --locked`, which raises an error instead of updating a stale lockfile — drift detection
  for free, no extra step. `--frozen` is the wrong flag here: it uses the lockfile *without*
  checking it is current. *Checkable:* the CI log shows `uv sync --locked`; the tree contains a
  committed lockfile and no `requirements.txt`.
- **`ruff check` and `ruff format --check` are two separate commands; neither implies the other.**
  The formatter does not sort imports — import order is a *lint* rule (`I`), so a repo running only
  `ruff format --check` has no import-order gate at all. `--check` writes nothing and exits 1 on any
  file that would be reformatted, which is what makes it gate-grade rather than a fixer. Do not add
  black, flake8, isort, or pyupgrade alongside Ruff; Ruff replaces all of them, and two formatters
  that disagree produce a gate that flaps on untouched files. *Checkable:* the aggregate names both
  commands; the dev dependency group contains none of the four.
- **A type tier is optional, and `pyright` is the option.** The PyPI `pyright` package pins a
  specific pyright release by default (stable enough to gate on) but resolves `node` from `PATH` or
  downloads one at runtime — a real cost in a Python-only image, which is why this tier is optional
  rather than default. See §8 for why `ty` is not the answer.

## 2. Run the Suite on Linux in CI — a Correctness Requirement, Not Hygiene
Any test asserting path containment, symlink rejection, case sensitivity, or file permissions is
meaningful only on the runtime OS. Run on the deployment OS in CI. On a Windows authoring machine
such a suite can pass **vacuously** — green, while the escape it was written to catch still works in
the Linux container. Three distinct mechanisms, each sufficient on its own:
- **The escape may never be constructed.** Creating a symlink on Windows requires
  `SeCreateSymbolicLinkPrivilege`, and `os.symlink` raises `OSError` for an unprivileged user. A
  fixture that builds a symlink out of the sandbox root and is `skipif`-guarded — or that swallows
  the error — leaves the assertion unexecuted. The test reports green having tested nothing.
- **Case sensitivity inverts the verdict.** Windows path comparison folds case and Linux does not,
  so a containment assertion over differently-cased paths answers differently on each platform.
- **Canonicalization itself diverges.** The stdlib says so directly: making a path canonical
  "differs slightly between Windows and UNIX with respect to how links and subsequent path
  components interact." Drive-relative (`C:name`) and UNC (`\\server\share`) inputs carry no Linux
  meaning, and a POSIX-absolute traversal input resolves under the current drive on Windows — the
  string the test exercised is not the string the attacker sends.

Local runs are a convenience, never the evidence. *Checkable:* the workflow's `runs-on` is the
deployment OS, and the suite runs with `-rs` so a silently-skipped guard prints its reason in the
CI log instead of vanishing into the summary count.

## 3. Test Security Logic as Pure Functions
Every allow/deny decision belongs in a pure function taking plain arguments and returning a
decision — importable and callable from a test with no server, transport, or event loop. Leave only
protocol wiring to the integration layer. A guard reachable only through a server call cannot be
enumerated exhaustively: each hostile input costs a round trip, so the case table stays small and
the interesting inputs go untested. (Python refinement of `foundation-testing.md` §6.) *Checkable:*
the hostile-input cases are a parametrized table over an imported function, not a sequence of client
calls.

## 4. Canonicalize Before Comparing
`Path.resolve()` **then** `is_relative_to(root)` — in that order, both steps, every time, with the
root resolved once and compared resolved-against-resolved. The order is load-bearing and the docs
are explicit about why: `resolve()` makes the path absolute "resolving any symlinks" and is the only
method that eliminates `..`; `is_relative_to()` is "string-based; it neither accesses the filesystem
nor treats `..` segments specially" — so calling it alone happily approves `root/../../etc`.
- Never string prefix matching: `str(p).startswith(str(root))` accepts `/root-evil` under `/root`.
- Never `os.path.abspath()`: it is `normpath(join(getcwd(), path))`, and normpath is "string
  manipulation [that] may change the meaning of a path that contains symbolic links."
- Never hand-rolled `..` stripping, for the same reason — lexical, symlink-blind, and it silently
  *creates* a legitimate-looking path out of an escape.

*Checkable:* grep the package for `startswith`, `abspath`, and `..` replacement applied to path
values — every hit is a defect; §2's symlink case is what red-proves the resolved form on Linux.

## 5. Prove a Read-Only Surface at Three Layers
Assert all three, and **trip each at least once** — a refuse-write test never observed failing is
not evidence (`foundation-testing.md` §1C, applied to a capability rather than a suite):
1. **Tool surface** — the advertised tool list is disjoint from the mutator set.
2. **Code surface** — no write syscall appears anywhere in the server package.
3. **Container surface** — the runtime declaration is read-only and unprivileged, asserted as a
   test over the compose/manifest file rather than trusted by inspection. The hardening substance
   belongs to the container rule; what this gate owns is that the declaration is *asserted* and that
   the assertion has been seen to fail.

*Checkable:* three named tests, and a red-proof for each pasted into the ticket — failing output
first, passing output second.

## 6. On stdio Transport, stdout Is JSON-RPC Only
The transport spec is a hard MUST NOT: a server "MUST NOT write anything to its `stdout` that is not
a valid MCP message," while it "MAY write UTF-8 strings to its standard error (`stderr`) for logging
purposes." One stray `print()` — a leftover debug line, a library banner, a warning — corrupts the
protocol stream and the failure surfaces as an unrelated client-side parse error. Send every
diagnostic and audit record to **stderr** as structured JSON, one line per tool invocation carrying
tool name, resolved path, allow/deny decision, and reason. *Checkable:* a test that runs a session
and asserts every stdout line parses as JSON-RPC; plus a grep for bare `print(` in the server
package (a `print(..., file=sys.stderr)` is fine, a bare one is a defect).

## 7. Pin Every External Artifact by Immutable Identity
A mutable reference means the build that passed and the build that ships are not the same build.
Pin by identity and record why in the commit that moves the pin:
- Container images by `tag@sha256:` — the tag for humans, the digest for the resolver.
- GitHub Actions by full commit SHA, not a tag or branch; tags are movable refs.
- MCP libraries with an upper major bound (e.g. `fastmcp>=3.4,<4`, and `mcp>=1.27,<2` if depended on
  directly) — both ecosystems ship breaking changes across majors, and pre-releases of the next
  major are already published, so an unbounded specifier is a scheduled outage.

Bumps land in a dedicated commit that also re-runs the gate — never bundled into a feature change,
where a green run cannot distinguish "the feature works" from "the new version works." *Checkable:*
grep the workflows and compose files for any `uses:` without a 40-char SHA and any `image:` without
`@sha256:`; grep the dependency table for an unbounded MCP specifier.

## 8. Explicitly Not Asserted
- **No `ty` gate.** Astral's own package metadata says "ty does not yet have a stable API; breaking
  changes, including changes to diagnostics, may occur between any two versions" and "ty is
  currently in beta" — and it is still on `0.0.x`. Gating on a tool whose *diagnostics* may change
  between patch releases means an unrelated bump turns the build red with no code change. `ty` is a
  good fast local convenience; `pyright` (§1) is the gate-grade option if a type tier is wanted.
- **No `src/` layout requirement for a single-file tool.** A layout convention that exists to <!-- taxonomy-ignore-line -->
  prevent accidental imports of an uninstalled package solves a problem a single-file operator tool
  does not have. Point the test runner at the root explicitly instead and say so in a comment.
- **No coverage threshold** — it measures lines executed, not properties proven, and §3 plus §5's
  parametrized hostile-input tables are the real signal.
- **No OS/Python matrix** — §2 requires the deployment OS, and a matrix multiplies CI time to test
  platforms nothing runs on.
- **No tox/nox** — §1's aggregate is one script; an environment-matrix orchestrator on top of uv is
  a second dependency resolver disagreeing with the lockfile.

## Sources
Load-bearing external claims, fetched 2026-07-25:
- `https://docs.astral.sh/uv/concepts/projects/sync/`, `https://docs.astral.sh/uv/reference/cli/`,
  `https://docs.astral.sh/uv/guides/scripts/` — `--locked` vs `--frozen`, `uv lock --script`.
- `https://docs.astral.sh/ruff/formatter/`, `https://docs.astral.sh/ruff/` — `--check` semantics and
  exit codes, formatter/linter split, the replaced-tools list.
- `https://docs.python.org/3/library/pathlib.html`, `https://docs.python.org/3/library/os.path.html`
  — `resolve()`, `is_relative_to()`, `abspath`/`normpath`/`realpath`.
- `https://modelcontextprotocol.io/specification/2025-06-18/basic/transports` — the stdio MUST NOT.
- `https://pypi.org/project/ty/` (0.0.63), `https://pypi.org/project/pyright/` (1.1.411),
  `https://pypi.org/project/fastmcp/` (3.4.4, with 4.0.0a* published),
  `https://pypi.org/project/mcp/` (1.28.1).
