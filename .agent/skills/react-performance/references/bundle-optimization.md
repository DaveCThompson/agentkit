# Bundle Optimization Rules

**Impact: CRITICAL**

Reducing initial bundle size improves Time to Interactive and Largest Contentful Paint.

## Avoid Barrel File Imports

Import directly from source files instead of barrel files (index.js that re-exports).

**Incorrect:**
```tsx
import { Check, X, Menu } from 'lucide-react'
// Loads 1,583 modules, 200-800ms import cost
```

**Correct:**
```tsx
import Check from 'lucide-react/dist/esm/icons/check'
import X from 'lucide-react/dist/esm/icons/x'
// Loads only needed modules
```

**Commonly affected libraries:**
- `lucide-react`
- `@radix-ui/react-*`
- `lodash` (use `lodash-es/function`)
- `date-fns`

## Dynamic Imports for Heavy Components

Use `React.lazy()` for components not needed on initial render.

**Incorrect:**
```tsx
import MonacoEditor from './MonacoEditor'
// Bundles ~300KB with main chunk
```

**Correct:**
```tsx
const MonacoEditor = React.lazy(() => import('./MonacoEditor'))

function CodePanel() {
  return (
    <Suspense fallback={<Skeleton />}>
      <MonacoEditor />
    </Suspense>
  )
}
```

## Preload on User Intent

Preload heavy bundles on hover/focus to reduce perceived latency.

```tsx
function EditorButton({ onClick }) {
  const preload = () => {
    void import('./MonacoEditor')
  }

  return (
    <button
      onMouseEnter={preload}
      onFocus={preload}
      onClick={onClick}
    >
      Open Editor
    </button>
  )
}
```

## Conditional Module Loading

Load large modules only when feature is activated.

```tsx
function AnimationPlayer({ enabled }) {
  const [frames, setFrames] = useState(null)

  useEffect(() => {
    if (enabled && !frames) {
      import('./animation-frames')
        .then(mod => setFrames(mod.frames))
    }
  }, [enabled, frames])

  if (!frames) return <Skeleton />
  return <Canvas frames={frames} />
}
```
