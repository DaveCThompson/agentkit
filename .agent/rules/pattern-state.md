---
trigger: glob
globs: "**/*Atom*.ts"
tier: kind:app
domain: state
---

# State Management Patterns

Choose state ownership, persistence and subscriptions from actual consumers and lifecycle.
Apply Jotai-specific methods only when that library is installed; no prop-depth quota, directory
tree or store choice follows from this rule's activation glob.

Read the project's state architecture, runtime/store versions and relevant consumers. Preserve
local state, context, server/query caches and other established mechanisms when they fit.
`tech-react.md` owns React identity/render constraints; `foundation-testing.md` owns proof.

## 1. Atom Naming

Use stable names that convey domain and role under project convention. An `Atom` suffix,
`derived...` prefix or async suffix can aid discovery but is not an API requirement.
Do not rename public atoms solely to match this kit's example. Keep identity separate from
display/debug names and from persisted storage keys.

## 2. Atom Organization

Keep atom definitions near the domain they own, sharing an API when multiple consumers need
the same state. A barrel is useful for an intended public boundary; it is not required for all
cross-feature access. Avoid cycles and global modules that couple independent domains.

In Jotai, an atom config is a definition; its value lives in a store. Preserve atom identity and
store lifetime across the renders that should share state. Create dynamic atoms through a stable
owner or the documented memo/ref pattern when needed, not a fresh config on each render.
Choose Provider/store boundaries for actual request, user, tenant and component isolation;
do not share user-specific server state through an unintended global store.

Before deleting an apparently unused atom, check dynamic registration, subscriptions, exported
APIs and intentionally dormant consumers. Preserve legitimate disabled features and their owner.
See [Jotai atom identity](https://jotai.org/docs/core/atom) and
[Provider/store scope](https://jotai.org/docs/core/provider).

## 3. Derived State

Prefer a derived value when it expresses current source state without a second synchronization
path. Local calculations can remain in a component; shared derived atoms/selectors are useful
when they clarify ownership or narrow actual subscriptions. An editable draft, saved snapshot
or historical value is not redundant merely because a current value can be computed.

Keep read/selector logic pure and understand tracked dependencies and output equality.
Jotai does not make every expensive computation free or remove the need for stable references.
Measure render/subscription cost before adding memoization or selection helpers; preserve the
intended update semantics. Use the installed library's API and
[performance guidance](https://jotai.org/docs/guides/performance), not a blanket memoization ban.

## 4. Async Atoms

Choose a coherent loading/error model for the consumer. Jotai async reads may use Suspense plus
an error boundary, or a supported wrapper such as `loadable` for explicit loading/data/error
states. Do not add a separate loading atom by default or catch every failure into empty data.
An async write's rejection also needs handling at the action/caller boundary; Suspense is not
a universal write-error handler.

Keep disabled, waiting, empty, success, stale and failed states distinct where they affect the
user. Define retries and stale-result protection. With applicable Jotai v2 async reads,
`options.signal` can cancel cooperative work before a new calculation; pass it to supported
operations rather than assuming it cancels every effect or rolls back mutations.
Preserve dependency ordering and authority checks when parallelizing independent reads.

For coordinated updates, distinguish store notification/batching from external atomicity.
Model partial failure for network or persistence writes. Inspect effects/subscriptions and their
teardown separately from promise completion.
See [Jotai async behavior](https://jotai.org/docs/guides/async),
[explicit async states](https://jotai.org/docs/utilities/async) and the
[atom API](https://jotai.org/docs/core/atom).

## 5. Atom Families

Use a family/cache when dynamically keyed state benefits from stable lookup and reuse.
Choose keys/equality from actual identity, including user/tenant scope where necessary.
Fresh object keys can create unintended entries under reference equality.

Bound retained entries according to the collection's lifetime and memory cost. Use the installed
family implementation's eviction API when entries are no longer needed. Verify active consumers
and other stores before eviction: removing a cache entry can cause a later lookup to create a
different atom, while existing consumers still hold the old one. Cache removal does not by itself
cancel requests, dispose listeners or erase persisted state.

Check current public exports and migration/deprecation guidance for the installed family package.
Do not install a replacement or migrate a supported project merely because documentation recommends
one for new work. See [Jotai family cache and removal semantics](https://jotai.org/docs/utilities/family).

## 6. Persistence

Persist only state that the product should retain. Use the actual storage abstraction; browser
storage is not a secret store or an authorization source. Define user/tenant key scope, reset/logout
behavior, version compatibility and retention before changing persisted identity.

Validate parsed data at the trust boundary. Handle malformed, missing, stale and unavailable
storage, quota/write failures and cross-tab updates where supported. `JSON.parse` alone does not
prove the value matches its TypeScript type. Reuse existing validation/migration code.

Versioning can live in a payload or key according to the existing contract. Changing a key can
strand useful data; define migration, fallback and authorized cleanup rather than silently
discarding it. Avoid overwriting a newer valid value with late hydration or a stale response.

For SSR, browser storage is unavailable to the server. Make initial markup/state agree with the
hydration strategy and keep a usable fallback for storage-dependent content. A client-only boundary
may be appropriate for that fragment; do not hide an entire page as a universal workaround.
Check the installed `atomWithStorage`/adapter initialization and subscription behavior; see
[Jotai storage guidance](https://jotai.org/docs/utilities/storage).

## 7. Anti-Patterns

- Prop depth is a signal to inspect ownership, not a threshold that forces atoms. Local props,
  composition, context and a store have different costs and semantics.
- Split state when independent consumers or lifetimes benefit. Do not split a coherent transaction
  merely to reduce atom size, or combine unrelated domains into one frequently changing value.
- Use ordinary setters for simple updates and explicit action/write APIs for domain operations
  when they clarify constraints. Preserve immutable updates where the state contract requires them;
  mutating a stored object in place can bypass expected notification/equality behavior.
- Avoid copied derived state that requires unnecessary synchronization, but retain drafts, snapshots
  and deliberate caching with explicit invalidation/ownership.
- Do not hide errors, stale requests, missing identity or persistence failures behind a successful
  empty result.

## 8. Testing

Use an isolated store/Provider when tests must not share state; direct store tests can establish
pure transitions, while component/integration tests cover subscriptions, effects and interaction.
Keep mocks aligned with real values and distinguish their coverage from storage/network behavior.

Test the affected invariants: legitimate transitions and rejected inputs, derived updates,
multiple consumers, identity across rerenders/remounts, async rejection/races, and persistence
migration or user isolation where changed. Use deterministic time/fixtures when relevant.
Snapshots can support a stable serialized contract, but a snapshot alone does not establish
interaction, failure recovery or absence of cross-user state leakage.

## Verification

### Invariants (Automated)

Use configured type/lint checks and the actual state test harness. Check collection and source
coverage. Text searches for atom names or barrels can locate candidates; they cannot prove
reachability, identity stability or correctness of an asynchronous state machine.

### Logic (Manual/Reasoning)

- Are source, derived, draft and persisted state distinguished by ownership and lifetime?
- Do atom/store/selector identities and equality match the intended consumer updates?
- Can loading/error/cancellation and teardown reach an honest usable terminal state?
- Are cache retention, user isolation and storage migrations tested where affected?
- Does the evidence cover the actual contract, with missing runtime proof named?

## See Also

- `tech-react.md` — render, component state, subscriptions and lifecycle.
- `tech-typescript.md` — actual types and runtime validation boundaries.
- `foundation-testing.md` — outcome/state evidence and relevant proof lanes.
- `foundation-security.md` — authority, secrets and persisted-data trust.
