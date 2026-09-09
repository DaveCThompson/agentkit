# Re-render patterns

Treat these as candidates for an observed cost. Prefer correct state flow and existing patterns
before adding `useMemo`, `useCallback` or `React.memo`. Memoization is not a correctness boundary.

## Functional state updates

When the next value depends on pending state, use an updater:

```tsx
const handleClick = () => setCount(previous => previous + 1);
```

If a measured memoized consumer requires a stable callback, `useCallback` can wrap it with all
remaining reactive dependencies. Do not claim a reference is stable forever or remove other
values from the dependency list. The updater must be pure.

## Lazy state initialization

Avoid evaluating an expensive initializer on every render:

```tsx
const [data] = useState(() => expensiveComputation());
```

This initializes state rather than recalculating it on each normal update. React can call a pure
initializer twice in development Strict Mode, and remounts initialize again. It does not track
later prop changes. See [useState](https://react.dev/reference/react/useState).

## Memoize measured expensive work

For an expensive filtered list whose inputs often remain stable, a candidate is:

```tsx
import { memo, useMemo } from 'react';

const FilteredList = memo(function FilteredList({ items, filter }) {
  const filtered = useMemo(() => items.filter(filter), [items, filter]);
  return <List items={filtered} />;
});
```

`List` is the application's renderer. Both input identities must remain stable for cache reuse;
new arrays/functions can defeat it. State/context changes still render relevant consumers.
Measure the cache's cost and inspect compiler output before adding it. See [React memo](https://react.dev/reference/react/memo).

## Effect dependencies and subscriptions

If an effect uses only a user's ID, depend on that ID rather than the whole changing object.
Do not drop dependencies that affect the result; handle stale async responses and cleanup.
Prefer deriving cheap values during render over effect-driven derived-state loops.

Subscribe to a derived value when the store supports selection and equality checks. For example,
a consumer that only needs `isEmpty` may avoid notifications for unrelated item edits. Keep the
selector/derived atom identity stable and verify the installed store's equality behavior. Moving
`items.length === 0` below a full-array subscription alone does not reduce notifications.

## Transitions for non-urgent updates

Keep a controlled input's value urgent. A transition can give result rendering lower priority;
it does not defer or offload synchronous search work. React invokes the callback immediately.
This example is appropriate only when `search` is cheap and rendering results is the measured cost:

```tsx
import { useState, useTransition } from 'react';

function Search({ search, Results }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  function handleChange(event) {
    const value = event.currentTarget.value;
    setQuery(value);
    const nextResults = search(value); // Synchronous work, still on the main thread.
    startTransition(() => setResults(nextResults)); // Lower-priority React update.
  }

  return (
    <>
      <input aria-label="Search" value={query} onChange={handleChange} />
      <div aria-busy={isPending}><Results items={results} /></div>
    </>
  );
}
```

If profiling instead finds a blocking search calculation, reduce its work, use a worker, or
chunk it with explicit yields and cancellation. An async function that performs all CPU work
before yielding still blocks. `useDeferredValue` can help separate expensive result rendering
from typing, but does not make arbitrary synchronous code preemptible or debounce network calls.
Handle stale results and errors in asynchronous search. Check the installed React version's
async transition rules before moving updates across `await`; see [startTransition](https://react.dev/reference/react/startTransition)
and [useDeferredValue](https://react.dev/reference/react/useDeferredValue).
