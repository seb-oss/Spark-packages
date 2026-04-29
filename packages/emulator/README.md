# `@sebspark/emulator`

Helper for building emulators or test fakes.

## Overview

This package provides a generic, type-safe emulator engine. The idea is that you wrap it in a concrete emulator that adapts a real transport (HTTP, Pub/Sub, gRPC, etc.) to the emulator's simple request/response model. Tests then configure the emulator to respond in specific ways, without needing a real backend.

```
Real transport (Pub/Sub message, HTTP request, WebSocket, …)
        │
        ▼
  Your emulator adapter        ← decodes, calls emulator.handle(...)
        │
        ▼
   createEmulator()            ← dispatches to registered responders
        │
        ▼
  Your test                    ← registers responders with .reply() / .callback() / .stream()
```

---

## Example: request/response — payment gateway

The simplest case: one request, one response. A payment gateway is a natural fit.

```ts
import { createEmulator, disposable, type Disposable } from '@sebspark/emulator'

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

export type PaymentEmulator = Disposable<
  ReturnType<typeof createEmulator<PaymentMethodMap>>
>

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

In tests:

```ts
it('returns an auth code on approval', async () => {
  payments.authorise().reply({ authCode: 'ABC123', status: 'approved' })

  const result = await client.authorise({ amount: 100, currency: 'SEK' })

  expect(result.authCode).toBe('ABC123')
})
```

---

## Example: streaming — chatbot over WebSocket

When a single request triggers a series of responses, use a streaming responder. A WebSocket chatbot that emits tokens one at a time is a natural fit.

```ts
import { createEmulator, disposable, type Disposable } from '@sebspark/emulator'
import { WebSocketServer, type WebSocket } from 'ws'

type ChatMethodMap = {
  chat: {
    args: { sessionId: string; message: string }
    resp: { token: string; done: boolean }
  }
}

export type ChatEmulator = Disposable<
  ReturnType<typeof createEmulator<ChatMethodMap>>
>

export const createChatEmulator = (port: number): ChatEmulator => {
  const emulator = createEmulator<ChatMethodMap>()
  const wss = new WebSocketServer({ port })

  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', async (data) => {
      const args = JSON.parse(data.toString()) as ChatMethodMap['chat']['args']
      await emulator.handle('chat', args, async (resp) => {
        ws.send(JSON.stringify(resp))
      })
    })
  })

  return disposable(emulator, () => wss.close())
}
```

### Fixed reply with `.callback()`

Use `.callback()` when the full sequence of tokens is known upfront:

```ts
bot.chat().callback((_args, cb) => {
  cb({ token: 'Sure', done: false })
  cb({ token: ', here', done: false })
  cb({ token: ' you go.', done: true })
})
```

### Test-driven streaming with `.stream()`

Use `.stream(initializer)` when the test needs to **drive responses at its own pace** — for example to assert state between tokens, or simulate a correction mid-stream.

`.stream()` returns a `StreamHandle`:

| Member | Type | Description |
|---|---|---|
| `waitForCall()` | `() => Promise<void>` | Resolves when the next request has arrived and the initializer has fired |
| `send(modifier)` | `(fn: (prev) => Resp) => Promise<void>` | Derives and sends the next response from the last one |
| `latestResponse` | `Resp \| undefined` | The most recent response sent, or `undefined` before the first `waitForCall()` |
| `hasBeenCalled` | `boolean` | `true` once the first request has arrived and `waitForCall()` has resolved |

```ts
it('streams a correction mid-reply', async () => {
  const stream = bot
    .chat()
    .stream(() => ({ token: 'Paris is in Germany.', done: false }))

  const received: string[] = []
  client.chat({ sessionId: 's1', message: 'Where is Paris?' }, (r) => {
    received.push(r.token)
  })

  await stream.waitForCall()
  expect(stream.latestResponse).toEqual({ token: 'Paris is in Germany.', done: false })

  await stream.send(() => ({ token: 'Sorry — Paris is in France.', done: true }))

  expect(received).toEqual([
    'Paris is in Germany.',
    'Sorry — Paris is in France.',
  ])
})
```

#### Sequential streams with `.times(n)`

The lifetime modifier caps how many **requests** the responder accepts. Each `waitForCall()` picks up the next one. `send()` and `latestResponse` are always scoped to the stream resolved by the most recent `waitForCall()`.

```ts
const stream = bot.chat().twice().stream(() => ({ token: 'Hello!', done: false }))

// First connection
client.chat({ sessionId: 's1', message: 'hi' }, onToken)
await stream.waitForCall()
await stream.send(() => ({ token: 'How can I help?', done: true }))

// Second connection
client.chat({ sessionId: 's2', message: 'hello' }, onToken)
await stream.waitForCall()
await stream.send(() => ({ token: 'Welcome back.', done: true }))

// Third connection → throws, responder exhausted
```

Calling `send()` before `waitForCall()` resolves throws immediately:

```ts
const stream = bot.chat().stream(() => ({ token: 'init', done: false }))
await stream.send(...) // throws: No active stream — call waitForCall() first
```

---

## API reference

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

```ts
bot.chat().callback((_args, cb) => {
  cb({ token: 'Sure', done: false })
  cb({ token: ', here', done: false })
  cb({ token: ' you go.', done: true })
})
```

### Externally-driven streaming — `.stream()`

See the [chatbot example](#example-streaming--chatbot-over-websocket) above. `StreamHandle<R>` is a named export if you need to type a helper:

```ts
import { type StreamHandle } from '@sebspark/emulator'

function driveStream(handle: StreamHandle<ChatResp>) { ... }
```

### Lifetime control

By default, a responder is consumed after **one use**. Control this with:

| Method | Behaviour |
|---|---|
| `.reply(...)` / `.callback(...)` / `.stream(...)` | One-time (default) |
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

Responders are matched in **LIFO order** — the most recently registered matching responder wins.

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

If a request arrives with no matching responder registered, the emulator throws immediately rather than returning a silent default:

```ts
await payments.authorise(...)
// throws: No responder found for .authorise(...)
```

### Direct invocation — `.execute()`

Each registration returns an `.execute()` helper for triggering the responder directly without going through the transport:

```ts
const { execute } = payments
  .authorise()
  .reply({ authCode: 'TEST', status: 'approved' })

const result = await execute({ amount: 100, currency: 'SEK' })
// result → { authCode: 'TEST', status: 'approved' }
```

### Inspecting and resetting

#### `pending` — count unspent responders

`payments.authorise().pending` returns the number of responders currently registered for that method that have not yet been fully consumed.

This is most useful in `afterEach` to catch leftover setup — a responder registered in a test but never triggered indicates a test that didn't exercise what it intended:

```ts
afterEach(() => {
  expect(payments.authorise().pending).toBe(0)
  expect(payments.refund().pending).toBe(0)
})
```

A `.persist()` responder counts as 1 pending regardless of how many times it has fired.

#### `.reset()` — clear registered responders

`payments.authorise().reset()` removes all responders for that method. `payments.reset()` removes all responders across every method.

The per-method form is useful when you want to swap out a responder mid-test:

```ts
payments.authorise().persist().reply({ authCode: 'DEFAULT', status: 'approved' })

// Later in the test, replace it entirely
payments.authorise().reset()
payments.authorise().reply({ authCode: 'OVERRIDE', status: 'declined' })
```

Use the emulator-level reset for blanket teardown in `afterEach`:

```ts
afterEach(() => {
  payments.reset()
})
```

---

## Cleanup

`disposable()` adds `.dispose()` and the `Symbol.dispose` / `Symbol.asyncDispose` symbols for `using` / `await using` (Node 20+).

```ts
// Explicit
await payments.dispose()

// Or with the `using` keyword (TypeScript 5.2+, Node 20+)
await using payments = startPaymentEmulator(server)
// automatically disposed when the block exits
```

