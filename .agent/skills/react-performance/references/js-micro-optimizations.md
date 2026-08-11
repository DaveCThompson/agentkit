# JavaScript Micro-Optimization Rules

**Impact: LOW-MEDIUM**

Micro-optimizations for hot paths that can add up to meaningful improvements.

## Early Return Pattern

Exit functions early to avoid unnecessary computation.

**Incorrect:**
```tsx
function processItems(items: Item[]) {
  let result = null
  if (items && items.length > 0) {
    result = items.map(item => transform(item))
  }
  return result
}
```

**Correct:**
```tsx
function processItems(items: Item[]) {
  if (!items?.length) return null
  return items.map(item => transform(item))
}
```

## Use Set/Map for O(1) Lookups

Replace array `.includes()` with Set for repeated lookups.

**Incorrect:**
```tsx
const allowedIds = ['a', 'b', 'c', 'd', 'e']

function isAllowed(id: string) {
  return allowedIds.includes(id) // O(n)
}
```

**Correct:**
```tsx
const allowedIds = new Set(['a', 'b', 'c', 'd', 'e'])

function isAllowed(id: string) {
  return allowedIds.has(id) // O(1)
}
```

## Cache Function Results

Memoize expensive pure functions.

**Incorrect:**
```tsx
function getTheme(mode: 'light' | 'dark') {
  return expensiveThemeCalculation(mode) // Runs every call
}
```

**Correct:**
```tsx
const themeCache = new Map<string, Theme>()

function getTheme(mode: 'light' | 'dark') {
  if (!themeCache.has(mode)) {
    themeCache.set(mode, expensiveThemeCalculation(mode))
  }
  return themeCache.get(mode)!
}
```

## Use toSorted() for Immutability

Modern JS immutable sort (ES2023+).

**Incorrect:**
```tsx
const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name))
```

**Correct:**
```tsx
const sorted = items.toSorted((a, b) => a.name.localeCompare(b.name))
```

## Length Check Before Iteration

Check length before expensive operations.

**Incorrect:**
```tsx
function processAll(items: Item[]) {
  return items.flatMap(item => processItem(item))
}
```

**Correct:**
```tsx
function processAll(items: Item[]) {
  if (items.length === 0) return []
  return items.flatMap(item => processItem(item))
}
```
