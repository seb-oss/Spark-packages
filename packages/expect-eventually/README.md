# `@sebspark/expect-eventually`

Adds a chainable `.eventually()` to vitest's `expect` for polling-based assertions in e2e tests.

## When to use this

This is **not** a replacement for fake timers in unit tests. It is designed for e2e tests where you trigger a real side effect — publishing a message to PubSub, making an HTTP call, writing to a database — and then need to wait for the result to propagate before asserting.

In these scenarios you don't know exactly how long it will take, but you don't want to add an arbitrary `sleep` either. `.eventually()` polls the assertion on a fixed interval and resolves as soon as it passes, failing only if the timeout is exceeded.

## Installation

```sh
yarn add --exact --dev @sebspark/expect-eventually
```

## Setup

Two steps are needed: one for the runtime patch, one for the types.

Register it as a vitest setup file so the prototype patch runs before every test:

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    setupFiles: ['./setup/expect-eventually.ts'],
  },
})
```

```ts
// setup/expect-eventually.ts
import '@sebspark/expect-eventually'
```

To make TypeScript aware of the `.eventually()` augmentation across all test files, either add it to `compilerOptions.types` in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@sebspark/expect-eventually"]
  }
}
```

Or import it in any `.d.ts` file already included in your project (e.g. `vitest.d.ts`):

```ts
import '@sebspark/expect-eventually'
```

## Usage

### Waiting for a mock to be called

Useful when you control both ends of an async flow and have a spy on the receiving end.

```ts
import '@sebspark/expect-eventually'
import { test, expect, vi } from 'vitest'

test('processes the published message', async () => {
  const onMessage = vi.fn()
  subscriber.on('message', onMessage)

  await pubsub.publish('my-topic', { hello: 'world' })

  await expect(onMessage).eventually().toHaveBeenCalledWith(
    expect.objectContaining({ hello: 'world' })
  )
})
```

### Observing a changing value

When the value you want to assert is not an object reference but a plain value that changes over time, wrap it in a getter function. `.eventually()` will call the getter on each attempt.

```ts
test('updates the record in the database', async () => {
  await api.post('/orders', { item: 'book' })

  await expect(() => db.orders.findFirst()).eventually().toMatchObject({
    item: 'book',
    status: 'pending',
  })
})
```

### Negated assertions

The full vitest assertion chain is supported, including `.not`.

```ts
test('removes the item from the queue', async () => {
  await expect(() => queue.length()).eventually().not.toEqual(0)
})
```

## Configuration

Pass an optional config object to control the polling behaviour.

```ts
await expect(fn).eventually({ timeout: 5000, interval: 100 }).toHaveBeenCalled()
```

| Option | Default | Description |
|---|---|---|
| `timeout` | `1000` | Maximum time in milliseconds to keep retrying |
| `interval` | `50` | Time in milliseconds between each retry attempt |

If the assertion does not pass within `timeout` ms, the promise rejects with the last assertion error.
