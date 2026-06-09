# @sebspark/idempotency

Idempotency guard for multi-step async processes, backed by Redis. Prevents duplicate execution when the same operation is triggered more than once concurrently.

## How it works

When a guard is created it immediately fires two parallel checks against Redis — without blocking the process from starting:

- **GET** on the key: if it already exists, a previous run completed successfully.
- **SUBSCRIBE** on a channel: if another in-flight process calls `end()` first, this one is notified.

Either check triggers an abort signal. If the guard's `run()` is still in progress when the signal fires, it rejects with an `IdempotencyConflictError` containing the value stored by the winning process.

The process that calls `end(value)` first stores the key in Redis and publishes to the channel, causing any concurrent processes to abort.

```
Process A ──── create ──── run(end => { ...; end(v) }) ✓   (stores + publishes)
Process B ──── create ──── run(end => { ... }) ──✗          (aborted by A's publish)
```

## Installation

```bash
yarn add @sebspark/idempotency
```

Requires a Redis client from the `redis` package:

```bash
yarn add redis
```

## Usage

```typescript
import { createClient } from 'redis'
import { IdempotencyGuard, IdempotencyConflictError } from '@sebspark/idempotency'

const client = createClient({ url: 'redis://localhost:6379' })
await client.connect()
```

### Basic example

`run()` receives an `end` callback as its first argument. Call `end(value)` once all steps have succeeded and before the function returns. The value passed to `end` is what gets stored in Redis and broadcast to concurrent guards — it does not have to match the function's return value.

```typescript
const guard = await IdempotencyGuard.create<Order, OrderId>(`order:${idempotencyKey}`, client)

try {
  const order = await guard.run(async (end) => {
    const validated = await validateOrder(body)
    const reserved  = await reserveInventory(validated)
    const charged   = await chargePayment(reserved)
    end(charged.id)   // commit the idempotency value — no await needed
    return charged    // return value may differ from the committed value
  })

  return res.status(201).location(`/orders/${order.id}`).send()

} catch (err) {
  if (err instanceof IdempotencyConflictError) {
    // err.value is the OrderId passed to end() by the winning process
    return res.status(200).location(`/orders/${err.value}`).send()
  }
  throw err
}
```

The two status codes reflect whether *this* process did the work:
- **201 Created** — this process completed all steps and created the order.
- **200 OK** — another process already completed it. The outcome is identical, so respond with the same `Location` header. The client doesn't need to know which happened.

### Type parameters

`IdempotencyGuard<R, V>` has two type parameters:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `R` | Return type of the function passed to `run()` | — |
| `V` | Type of the value passed to `end()` and carried by `IdempotencyConflictError` | `R` |

When the committed value and the return value are the same type, `create<Order>()` is sufficient.

### Lifecycle

| Step | Description |
|------|-------------|
| `IdempotencyGuard.create(key, client, options?)` | Creates the guard and starts background Redis checks. |
| `guard.run(fn)` | Passes an `end` callback to `fn` and races it against the abort signal. Resolves with the return value of `fn`. Rejects with `IdempotencyConflictError` if aborted, or `IdempotencyEndNotCalledError` if `fn` returns without calling `end`. |
| `end(value)` | Stores `value` in Redis and publishes it to abort concurrent guards. Must be called exactly once before `fn` returns. Fire-and-forget — no need to `await`. |

### Errors

| Error | When |
|-------|------|
| `IdempotencyConflictError<V>` | Another guard called `end()` first, or the key already exists from a previous run. `err.value` is the winning value. |
| `IdempotencyEndNotCalledError` | `fn` returned without calling `end`. |
| `IdempotencyEndNotCalledError` (different message) | `end` was called more than once. |

### Options

```typescript
IdempotencyGuard.create(key, client, {
  ttlSeconds: 86400 // How long the key lives in Redis. Default: 86400 (24h)
})
```

### Using the signal directly

`guard.signal` is a standard `AbortSignal`. Pass it to outgoing requests to cancel them when the guard aborts:

```typescript
const guard = await IdempotencyGuard.create<Order>(key, client)

const order = await guard.run(async (end) => {
  const data = await fetch('/external-api', { signal: guard.signal })
  const result = await processData(data)
  end(result)
  return result
})
```

## Error handling

```typescript
catch (err) {
  if (err instanceof IdempotencyConflictError) {
    console.log(err.value) // The value passed to end() by the winning process
  }
}
```

## Concurrency model

Neither process waits for the initial Redis GET before starting its steps. This means two processes can run in parallel for a short window before one of them is aborted. The guarantee is:

- **At most one process calls `end()`** — the first to call it wins.
- **Any concurrent process is aborted** either by the GET response (key already exists) or by the SUBSCRIBE notification (another process just called `end()`).
- **The conflict error carries the result** — no second Redis lookup needed in the caller.

This design optimises for the common case where duplicates are rare. Both processes do useful work up until the conflict is detected, rather than serialising on a lock upfront.

`end()` is fire-and-forget. Not awaiting it introduces a small race window: if the process crashes between calling `end()` and the write completing, the key is never stored and concurrent guards are never notified. This is an accepted tradeoff for throughput — the guarantee is eventual, not atomic.
