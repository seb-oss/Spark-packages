import { describe, expect, it, vi } from 'vitest'
import { normalizeResponder } from './normalize-responder'

type Args = { name: string }
type Resp = { message: string }

describe('normalizeResponder', () => {
  it('wraps a static value so the callback receives it', async () => {
    const responder = normalizeResponder<Args, Resp>({ message: 'hello' })
    const cb = vi.fn()
    await responder({ name: 'Alice' }, cb)
    expect(cb).toHaveBeenCalledExactlyOnceWith({ message: 'hello' })
  })

  it('calls a single-response function with the args and passes the result to cb', async () => {
    const responder = normalizeResponder<Args, Resp>(({ name }) => ({
      message: `hi ${name}`,
    }))
    const cb = vi.fn()
    await responder({ name: 'Bob' }, cb)
    expect(cb).toHaveBeenCalledExactlyOnceWith({ message: 'hi Bob' })
  })

  it('supports an async single-response function', async () => {
    const responder = normalizeResponder<Args, Resp>(async ({ name }) => ({
      message: `async ${name}`,
    }))
    const cb = vi.fn()
    await responder({ name: 'Carol' }, cb)
    expect(cb).toHaveBeenCalledExactlyOnceWith({ message: 'async Carol' })
  })

  it('passes a two-argument streaming function through unchanged', async () => {
    const streamingFn = vi.fn((_args: Args, cb: (r: Resp) => unknown) => {
      cb({ message: 'one' })
      cb({ message: 'two' })
    })
    const responder = normalizeResponder<Args, Resp>(streamingFn)
    const cb = vi.fn()
    await responder({ name: 'Dave' }, cb)
    expect(cb).toHaveBeenCalledTimes(2)
    expect(cb).toHaveBeenNthCalledWith(1, { message: 'one' })
    expect(cb).toHaveBeenNthCalledWith(2, { message: 'two' })
  })
})
