# Rendering Optimization Rules

**Impact: MEDIUM**

Optimizing the rendering process reduces the work the browser needs to do.

## Hoist Static JSX Elements

Extract static JSX outside components to avoid re-creation.

**Incorrect (recreates element every render):**
```tsx
function LoadingSkeleton() {
  return <div className="animate-pulse h-20 bg-gray-200" />
}

function Container() {
  return (
    <div>
      {loading && <LoadingSkeleton />}
    </div>
  )
}
```

**Correct (reuses same element):**
```tsx
const loadingSkeleton = (
  <div className="animate-pulse h-20 bg-gray-200" />
)

function Container() {
  return (
    <div>
      {loading && loadingSkeleton}
    </div>
  )
}
```

> **Note:** If your project has React Compiler enabled, this optimization is automatic.

## Explicit Conditional Rendering

Prefer ternary for explicit control over rendering.

**Incorrect (may render falsy values):**
```tsx
{count && <Badge count={count} />}
// Renders "0" if count is 0
```

**Correct:**
```tsx
{count > 0 ? <Badge count={count} /> : null}
// Never renders "0"
```

## Defer Layout Reads

Avoid reading layout properties during render.

**Incorrect:**
```tsx
function Component() {
  const ref = useRef<HTMLDivElement>(null)
  const width = ref.current?.offsetWidth ?? 0 // Forces layout
  // ...
}
```

**Correct:**
```tsx
function Component() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  
  useLayoutEffect(() => {
    if (ref.current) {
      setWidth(ref.current.offsetWidth)
    }
  }, [])
  // ...
}
```

## Content Visibility for Long Lists

Use CSS to defer rendering of off-screen content.

```css
.list-item {
  content-visibility: auto;
  contain-intrinsic-size: 0 50px;
}
```

## Isolate Re-renders via Composition

Avoid "Monolithic" components that manage all state at the top level. Use Radix-style composition to isolate stateful logic.

**Anti-pattern (Rendering monolith):**
Changing state in the Provider re-renders the entire subtree, including static parts like the Header.

```tsx
<ConfigurationProvider>
  <HeavyHeader />
  <Content state={state} />
</ConfigurationProvider>
```

**Optimization (Composability):**
By lifting the Provider or using composable sub-components, you can ensure only the components that *actually* need the state are re-rendered.

```tsx
<Composer.Root>
  <Composer.Header /> {/* Static part - doesn't re-render on input changes */}
  <Composer.Input />  {/* Stateful part - re-renders on input */}
</Composer.Root>
```

Benefit: Minimizes React's reconciliation work by reducing the number of children that need to be checked when state changes.
