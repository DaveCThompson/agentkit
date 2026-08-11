# Re-render Optimization Rules

**Impact: MEDIUM**

Reducing unnecessary re-renders minimizes wasted computation and improves UI responsiveness.

> **Repo caveat:** Treat this file as a generic reference sheet, not a default prescription. In this repo, prefer structure, measurement, and existing patterns before adding `useMemo`, `useCallback`, or `React.memo`.

## Functional setState

Use functional form when callback depends on previous state.

**Incorrect:**
```tsx
const handleClick = useCallback(() => {
  setCount(count + 1)
}, [count]) // Recreates on every count change
```

**Correct:**
```tsx
const handleClick = useCallback(() => {
  setCount(prev => prev + 1)
}, []) // Stable reference forever
```

## Lazy State Initialization

Pass function to useState for expensive initial values.

**Incorrect:**
```tsx
const [data] = useState(expensiveComputation())
// Runs on every render
```

**Correct:**
```tsx
const [data] = useState(() => expensiveComputation())
// Runs only on mount
```

## Memoize Expensive Components

Extract expensive work into memoized components.

**Incorrect:**
```tsx
function Parent({ items, filter }) {
  const filtered = items.filter(filter) // Runs on every render
  return <List items={filtered} />
}
```

**Correct:**
```tsx
const FilteredList = React.memo(function FilteredList({ items, filter }) {
  const filtered = useMemo(() => items.filter(filter), [items, filter])
  return <List items={filtered} />
})
```

## Primitive Dependencies

Use primitive values in effect dependencies, not objects.

**Incorrect:**
```tsx
useEffect(() => {
  fetchData(user.id)
}, [user]) // Runs when any user property changes
```

**Correct:**
```tsx
const userId = user.id
useEffect(() => {
  fetchData(userId)
}, [userId]) // Runs only when id changes
```

## Subscribe to Derived State

Subscribe to derived booleans, not raw values.

**Incorrect:**
```tsx
const items = useAtomValue(itemsAtom)
const isEmpty = items.length === 0
// Re-renders on any items change
```

**Correct:**
```tsx
const isEmptyAtom = useMemo(() => atom(get => get(itemsAtom).length === 0), [])
const isEmpty = useAtomValue(isEmptyAtom)
// Re-renders only when emptiness changes
```

## Transitions for Non-Urgent Updates

Use startTransition for updates that don't need immediate feedback.

```tsx
import { useTransition } from 'react'

function Search() {
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  const handleChange = (e) => {
    setQuery(e.target.value) // Urgent
    startTransition(() => {
      setResults(search(e.target.value)) // Can wait
    })
  }

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending ? <Spinner /> : <Results items={results} />}
    </>
  )
}
```
