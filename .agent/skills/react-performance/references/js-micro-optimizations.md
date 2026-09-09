# JavaScript hot-path candidates

Use only after a profile identifies significant JavaScript cost. Most syntax rewrites do not
establish a speedup. Preserve inputs, output identity requirements, ordering, mutation behavior
and error semantics before comparing representative workloads.

## Early returns

An early return can flatten control flow. It avoids computation only when the old branch actually
performed extra work. These shapes do the same mapping work for nonempty input:

```javascript
function processItems(items) {
  if (!items?.length) return null;
  return items.map(item => transform(item));
}
```

This contract intentionally maps absent/empty input to `null`; do not silently replace an
existing empty-array result or validation error. Prefer the clearer local style without a
performance claim when the execution paths are equivalent.

## Repeated lookups

A reusable `Set` or `Map` can reduce repeated scans over a large collection. Include construction
cost and memory in the measurement; building a new Set for one lookup can cost more than a scan.
Check equality and duplicates semantics and invalidate it when the source changes.

```javascript
const allowedIds = new Set(['a', 'b', 'c', 'd', 'e']);
const isAllowed = id => allowedIds.has(id);
```

The small example shows the API, not evidence of a useful optimization. JavaScript specifies
average sublinear access, not a universal constant-time guarantee; see [Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set).

## Cache pure calculations

Cache only when the key covers every input and reuse avoids enough work to justify retention.
For a fixed light/dark theme calculation, this bounded key space can be reasonable:

```javascript
const themeCache = new Map();
function getTheme(mode) {
  if (mode !== 'light' && mode !== 'dark') throw new Error('Unsupported mode');
  if (!themeCache.has(mode)) themeCache.set(mode, expensiveThemeCalculation(mode));
  return themeCache.get(mode);
}
```

The calculation must be pure and depend only on `mode`. Treat returned themes as immutable.
Include locale, configuration or user identity in keys when they affect the result, with an
appropriate lifetime/eviction strategy. Never share request-private data through a global cache.

## Nonmutating sort

Both forms below preserve the original array for ordinary dense arrays:

```javascript
const byName = (a, b) => a.name.localeCompare(b.name);
const sortedCopy = [...items].sort(byName);
const sortedModern = items.toSorted(byName);
```

Choose based on supported runtimes, typings and local style. `toSorted` requires runtime support
or an approved existing polyfill; a TypeScript target does not supply it. Neither form is a
universal performance winner. Check [toSorted](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted)
when sparse arrays, custom iterators or subclass behavior are part of the contract.

## Empty input and iteration

An empty ordinary array's `flatMap` does not invoke its callback. Adding `if (!items.length)
return []` does not avoid callback work already absent. Add a guard only when it skips other
measured setup work or clarifies an intentional contract. Do not file this syntax difference as
a performance finding without evidence.
