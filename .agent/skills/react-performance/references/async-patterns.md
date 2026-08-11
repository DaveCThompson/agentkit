# Async Optimization Rules

**Impact: HIGH**

Eliminating waterfalls in async operations yields significant performance gains.

## Promise.all for Independent Operations

When async operations have no interdependencies, execute concurrently.

**Incorrect (sequential, 3 round trips):**
```tsx
async function loadDashboard() {
  const user = await fetchUser()
  const settings = await fetchSettings()
  const notifications = await fetchNotifications()
  return { user, settings, notifications }
}
```

**Correct (parallel, 1 round trip):**
```tsx
async function loadDashboard() {
  const [user, settings, notifications] = await Promise.all([
    fetchUser(),
    fetchSettings(),
    fetchNotifications()
  ])
  return { user, settings, notifications }
}
```

## Defer Await Until Needed

Move `await` into branches where actually used.

**Incorrect:**
```tsx
async function handleSubmit(data, skipValidation) {
  const rules = await fetchValidationRules() // Always waits
  
  if (skipValidation) {
    return saveData(data)
  }
  
  return validateAndSave(data, rules)
}
```

**Correct:**
```tsx
async function handleSubmit(data, skipValidation) {
  if (skipValidation) {
    return saveData(data) // Returns immediately
  }
  
  const rules = await fetchValidationRules() // Only when needed
  return validateAndSave(data, rules)
}
```

## Start Early, Await Late

Start promises immediately, await when result is needed.

**Incorrect:**
```tsx
async function processOrder(orderId) {
  const order = await fetchOrder(orderId)
  const inventory = await checkInventory(order.items)
  const pricing = await calculatePricing(order)
  return finalizeOrder(order, inventory, pricing)
}
```

**Correct:**
```tsx
async function processOrder(orderId) {
  const orderPromise = fetchOrder(orderId)
  
  const order = await orderPromise
  
  // These can run in parallel once we have order
  const [inventory, pricing] = await Promise.all([
    checkInventory(order.items),
    calculatePricing(order)
  ])
  
  return finalizeOrder(order, inventory, pricing)
}
```

## Error Handling with Promise.allSettled

When you need all results even if some fail:

```tsx
async function loadUserData(userId) {
  const results = await Promise.allSettled([
    fetchProfile(userId),
    fetchPosts(userId),
    fetchFollowers(userId)
  ])
  
  return {
    profile: results[0].status === 'fulfilled' ? results[0].value : null,
    posts: results[1].status === 'fulfilled' ? results[1].value : [],
    followers: results[2].status === 'fulfilled' ? results[2].value : []
  }
}
```
