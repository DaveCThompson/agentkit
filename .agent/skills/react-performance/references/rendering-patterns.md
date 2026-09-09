# Rendering patterns

Use browser traces and the React Profiler to separate scripting, React rendering, DOM updates,
layout and paint. A component invocation need not produce a DOM mutation.

## Static JSX and memoization

Hoisting a truly static element can preserve its identity across parent renders, but it may
save negligible work. Keep it inside the component when it depends on props, context or local
state. Check what the project's React Compiler already optimizes before adding manual caching.
A component boundary is useful for structure; its spelling or namespace is not performance proof.

## Explicit conditional rendering

When a count of zero means no badge, make the condition boolean:

```tsx
{count > 0 ? <Badge count={count} /> : null}
```

`count && <Badge count={count} />` renders `0` when `count` is zero. This is a correctness issue
when zero is unintended, independent of performance. Preserve a visible zero when the UI requires it.

## Layout reads

Do not read DOM layout during React render. A ref may be unset or describe the previous commit,
and a layout read can force style/layout calculation if preceding writes invalidated it. If a
measurement must affect the same painted frame, measure after commit in `useLayoutEffect`:

```tsx
import { useLayoutEffect, useRef, useState } from 'react';

function MeasuredBox() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (ref.current) setWidth(ref.current.getBoundingClientRect().width);
  }, []);
  return <div ref={ref}>{width === null ? 'Measuring…' : `Width: ${width}`}</div>;
}
```

This example measures the border box once. It is not a resize subscription or free work: the
effect and state update can delay paint. Prefer CSS when it can solve the layout. Use the
project's observer pattern when dimensions can change, disconnect it on teardown, and avoid
measurement/update feedback loops. Keep SSR fallback content usable; see [useLayoutEffect](https://react.dev/reference/react/useLayoutEffect).

## Off-screen content

`content-visibility: auto` can defer off-screen rendering. An estimated intrinsic size limits
scroll shifts, but it must suit the real items:

```css
.list-item {
  content-visibility: auto;
  contain-intrinsic-size: auto 50px;
}
```

Check browser support, scroll geometry, focus, find-in-page and assistive-technology behavior.
This does not remove React's cost to create a large list. Consider virtualization for measured
DOM/render cost only with a plan for keyboard access and content discovery.

## Isolate frequently changing state

Move state close to its consumers when that reduces the actual propagation path. For example,
a local input update does not require its parent to render:

```tsx
import { useState } from 'react';

function SearchInput() {
  const [query, setQuery] = useState('');
  return <input aria-label="Search" value={query}
    onChange={event => setQuery(event.currentTarget.value)} />;
}

function SearchPanel() {
  return <section><h2>Search</h2><SearchInput /></section>;
}
```

This local state has no effect on the heading. In a real search, put result state/subscriptions
where needed. A context change still reaches consumers even through memoized ancestors; inspect
provider values, store selectors and prop identity. Passing stable children into a stateful
wrapper may help, while creating those children on each parent render may not. Verify which
components render in the Profiler instead of claiming a compositional API guarantees isolation.
