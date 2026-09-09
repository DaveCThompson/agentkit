# Async patterns

Use for an observed request waterfall or delayed independent work. Draw the dependency chain
before moving awaits. Concurrent requests still make separate network calls; wall time depends
on connections, server limits, cache state and contention.

## Independent work

When these reads are independent and the view needs all results, start them together:

```javascript
async function loadDashboard() {
  const [user, settings, notifications] = await Promise.all([
    fetchUser(), fetchSettings(), fetchNotifications(),
  ]);
  return { user, settings, notifications };
}
```

The fetch functions are application adapters. If one depends on another's identity or authority,
keep that dependency. `Promise.all` rejects when an input rejects; it does not cancel the other
operations or roll back side effects. For large fan-out, bound concurrency to the service's
capacity and respect rate limits. Do not parallelize dependent mutations for a speed claim.

## Defer work that a branch does not need

A bypass branch can skip fetching rules only when bypassing validation is already part of the
application contract. Do not introduce that bypass as an optimization.

```javascript
async function handleSubmit(data, skipValidation) {
  if (skipValidation) return saveData(data);
  const rules = await fetchValidationRules();
  return validateAndSave(data, rules);
}
```

## Start early, await at the dependency boundary

After loading an order, inventory and pricing checks may run together if neither consumes the
other's result. This example assumes reads/quotes, not inventory reservations or payment writes:

```javascript
async function processOrder(orderId) {
  const order = await fetchOrder(orderId);
  const [inventory, pricing] = await Promise.all([
    checkInventory(order.items), calculatePricing(order),
  ]);
  return finalizeOrder(order, inventory, pricing);
}
```

Starting a promise early is useful only if useful work overlaps it. Attach rejection handling
promptly and arrange cancellation when supported; do not leave speculative promises unobserved.

## Partial failures

Use `Promise.allSettled` when independent sections can fail separately. Preserve a failure state;
turning every rejection into an empty list makes an unavailable result look like no data.

```javascript
async function loadUserData(userId) {
  const [profile, posts, followers] = await Promise.allSettled([
    fetchProfile(userId), fetchPosts(userId), fetchFollowers(userId),
  ]);
  return { profile, posts, followers };
}
```

Consumers render fulfilled results and a suitable error/retry state for each rejection. Redact
error details before exposing them. For search and navigation, prevent older requests from
replacing newer results through cancellation or a request identity check. Compare response
latency and failure behavior under the same workload before claiming an improvement.
