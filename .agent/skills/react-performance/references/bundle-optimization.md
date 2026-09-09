# Bundle optimization

Use when transfer, module evaluation, or a loading waterfall is measured on the relevant path.
Keep development import cost separate from production payload and user interaction latency.

## Package entry points and barrel imports

A barrel import is a candidate to inspect, not inherently a defect. Check the installed package's
public exports, side effects and bundler output. For example, Lucide documents named imports and
tree shaking in its [React guide](https://lucide.dev/guide/react):

```tsx
import { Check, X } from 'lucide-react';
```

Keep this public import when the build removes unused icons. Use a documented public subpath
only when that package/version supports it and measurement shows a benefit. Do not reach into
`dist/` internals to satisfy a generic rule. Some barrels also cause development graph traversal
cost even if production tree shaking works; measure that separately before changing import strategy.

## Dynamic imports for heavy components

A feature not needed at initial render can use a lazy boundary. In this example `CodePanel`
is mounted only when the user opens the editor, and `MonacoEditor` has a default component export:

```tsx
import { lazy, Suspense } from 'react';

const MonacoEditor = lazy(() => import('./MonacoEditor'));

function CodePanel() {
  return (
    <Suspense fallback={<p role="status">Loading editor…</p>}>
      <MonacoEditor />
    </Suspense>
  );
}
```

Keep the lazy declaration outside the component. Follow the framework's server/client and
route-loading behavior; preserve required server HTML, stable fallback dimensions and a chunk-error
recovery path. A lazy component rendered immediately starts loading immediately. Splitting an LCP
component may add a critical request waterfall rather than improve it. See [React lazy](https://react.dev/reference/react/lazy).

## Preload on user intent

If likely navigation justifies speculative transfer, reuse the same module import on hover or
keyboard focus. Prefetch must not trigger the feature's business mutations. Observe rejected
imports and keep an actual-load error path; an ignored prefetch failure is not successful loading.
Test both cold and warm navigation and account for wasted bandwidth on abandoned intent.

## Conditional module loading

For non-component modules such as animation data, load only when the feature requires them.
Use the existing loader/cache or a scoped effect. Handle rejection, disable/unmount during load,
and late results. Render a disabled state when disabled, a loading state only while waiting, and
an error when loading fails. Dynamic import itself is not generally cancellable; ignoring a
stale result protects state but does not stop its download or evaluation.

## Evidence

Compare the actual emitted chunks and network waterfall at the same version/build/cache state.
Preserve package initialization side effects, stylesheet loading, feature behavior and recovery.
Report the affected metric and tradeoff without importing unattributed module counts, byte sizes
or timing estimates from another application.
