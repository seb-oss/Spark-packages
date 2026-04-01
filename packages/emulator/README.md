# `@sebspark/emulator`

Helper for building emulators or test fakes.

## Overview

This package provides a generic, type-safe emulator engine. The idea is that you wrap it in a concrete emulator that adapts a real transport (HTTP, Pub/Sub, gRPC, etc.) to the emulator's simple request/response model. Tests then configure the emulator to respond in specific ways, without needing a real backend.

```
Real transport (Pub/Sub message, HTTP request, …)
        │
        ▼
  Your emulator adapter        ← decodes, calls emulator.handle(...)
        │
        ▼
   createEmulator()            ← dispatches to registered responders
        │
        ▼
  Your test                    ← registers responders with .reply() / .callback()
```

## Building an emulator

Define a `MethodMap` that describes every operation your external system exposes, then wire up the transport to call `emulator.handle(...)`.

```ts
import { createEmulator, disposable, type Disposable } from '@sebspark/emulator'

// 1. Declare every method with its request and response types
type PaymentMethodMap = {
  authorise: {
    args: { amount: number; currency: string }
    resp: { authCode: string; status: 'approved' | 'declined' }
  }
  refund: {
    args: { authCode: string; amount: number }
    resp: { success: boolean }
  }
}

// 2. Expose a typed emulator handle
export type PaymentEmulator = Disposable<
  ReturnType<typeof createEmulator<PaymentMethodMap>>
>

// 3. Wire up the transport
export const startPaymentEmulator = (server: HttpServer): PaymentEmulator => {
  const emulator = createEmulator<PaymentMethodMap>()

  server.on('POST /authorise', async (req, res) => {
    await emulator.handle('authorise', req.body, async (response) => {
      res.json(response)
    })
  })

  server.on('POST /refund', async (req, res) => {
    await emulator.handle('refund', req.body, async (response) => {
      res.json(response)
    })
  })

  return disposable(emulator, () => server.close())
}
```

## Using the emulator in tests

The intended test pattern is **setup → execute → assert**, keeping each step explicit and local to the test. Register exactly one responder, trigger exactly one call, check the result:

```ts
it('returns an auth code on approval', async () => {
  // Setup
  payments.authorise().reply({ authCode: 'ABC123', status: 'approved' })

  // Execute
  const result = await client.authorise({ amount: 100, currency: 'SEK' })

  // Assert
  expect(result.authCode).toBe('ABC123')
})
```

The responder is consumed after the call, so a missing setup will throw immediately rather than silently reusing state from another test.

### Single response — `.reply()`

Register a static response or a function. The responder is consumed after one use.

```ts
// Static response
payments.authorise().reply({ authCode: 'ABC123', status: 'approved' })

// Computed from the request
payments.authorise().reply((args) => ({
  authCode: `CODE-${args.amount}`,
  status: args.amount > 0 ? 'approved' : 'declined',
}))
```

### Streaming responses — `.callback()`

Use `.callback()` when a single trigger produces multiple responses (e.g. order status updates).

```ts
payments.authorise().callback((args, cb) => {
  cb({ authCode: 'PENDING', status: 'approved' })
  cb({ authCode: 'SETTLED', status: 'approved' })
})
```

### Lifetime control

In most tests the one-shot default is exactly what you want. Lifetime modifiers are intended for more complex scenarios such as integration-style tests or helpers that need to serve many calls. Prefer explicit per-test setup over persistent responders wherever possible.

By default, a responder is consumed after **one use**. Control this with:

| Method | Behaviour |
|---|---|
| `.reply(...)` / `.callback(...)` | One-time (default) |
| `.once().reply(...)` | One-time (explicit) |
| `.twice().reply(...)` | Two uses |
| `.thrice().reply(...)` | Three uses |
| `.times(n).reply(...)` | `n` uses |
| `.persist().reply(...)` | Unlimited uses |

```ts
// Approve the first two, then always decline
payments.authorise().persist().reply({ authCode: '', status: 'declined' })
payments.authorise().twice().reply({ authCode: 'ABC', status: 'approved' })
```

Responders are matched in **LIFO order** — the most recently registered matching responder wins. This makes it easy to stack overrides.

### Filters

Pass a filter function to restrict which requests a responder handles:

```ts
payments
  .authorise((args) => args.currency === 'SEK')
  .reply({ authCode: 'SEK-OK', status: 'approved' })

payments
  .authorise()
  .reply({ authCode: 'OTHER', status: 'declined' })
```

### Stacking overrides

The most common pattern is a persistent default with one-time overrides layered on top. Because responders resolve in LIFO order, the override is consumed first, then every subsequent request falls through to the default:

```ts
// Always decline...
payments.authorise().persist().reply({ authCode: '', status: 'declined' })

// ...except the very next call, which is approved
payments.authorise().reply({ authCode: 'ABC123', status: 'approved' })

// First call  → approved (override consumed)
// Second call → declined (fallback)
// Third call  → declined (fallback)
```

### Unhandled requests

If a request arrives with no matching responder registered, the emulator throws. This is intentional — it surfaces missing setup immediately rather than returning a silent default:

```ts
// No responder registered
await payments.authorise(...)
// throws: No responder found for .authorise(...)
```

### Direct invocation — `.execute()`

Each registration returns an `.execute()` helper for triggering the responder directly in a test without going through the transport:

```ts
const { execute } = payments
  .authorise()
  .reply({ authCode: 'TEST', status: 'approved' })

const result = await execute({ amount: 100, currency: 'SEK' })
// result → { authCode: 'TEST', status: 'approved' }
```

## Cleanup

`disposable()` adds `.dispose()` and the `Symbol.dispose` / `Symbol.asyncDispose` symbols for `using` / `await using` (Node 20+).

```ts
// Explicit
await payments.dispose()

// Or with the `using` keyword (TypeScript 5.2+, Node 20+)
await using payments = startPaymentEmulator(server)
// automatically disposed when the block exits
```
