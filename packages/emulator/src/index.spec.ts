import { describe, expect, it, vi } from 'vitest'
import { createEmulator, disposable } from './index'

type TestMethodMap = {
  greet: { args: { name: string }; resp: { message: string } }
  add: { args: { a: number; b: number }; resp: { result: number } }
}

describe('createEmulator', () => {
  describe('reply', () => {
    it('delivers a static response via handle', async () => {
      const emu = createEmulator<TestMethodMap>()
      emu.greet().reply({ message: 'hello' })

      const cb = vi.fn()
      await emu.handle('greet', { name: 'Alice' }, cb)

      expect(cb).toHaveBeenCalledExactlyOnceWith({ message: 'hello' })
    })
    it('delivers a computed response via handle', async () => {
      const emu = createEmulator<TestMethodMap>()
      emu.greet().reply(({ name }) => ({ message: `hi ${name}` }))

      const cb = vi.fn()
      await emu.handle('greet', { name: 'Bob' }, cb)

      expect(cb).toHaveBeenCalledExactlyOnceWith({ message: 'hi Bob' })
    })
    it('is consumed after one use by default', async () => {
      const emu = createEmulator<TestMethodMap>()
      emu.greet().reply({ message: 'once' })

      await emu.handle('greet', { name: 'Alice' }, vi.fn())

      await expect(
        emu.handle('greet', { name: 'Alice' }, vi.fn())
      ).rejects.toThrow()
    })
  })
  describe('callback', () => {
    it('allows the responder to call the callback multiple times', async () => {
      const emu = createEmulator<TestMethodMap>()
      emu.greet().callback(({ name }, cb) => {
        cb({ message: `hello ${name}` })
        cb({ message: `goodbye ${name}` })
      })

      const cb = vi.fn()
      await emu.handle('greet', { name: 'Carol' }, cb)

      expect(cb).toHaveBeenCalledTimes(2)
      expect(cb).toHaveBeenNthCalledWith(1, { message: 'hello Carol' })
      expect(cb).toHaveBeenNthCalledWith(2, { message: 'goodbye Carol' })
    })

    it('can be invoked directly via execute', async () => {
      const emu = createEmulator<TestMethodMap>()
      const { execute } = emu.greet().callback(({ name }, cb) => {
        cb({ message: `hello ${name}` })
        cb({ message: `goodbye ${name}` })
      })

      const cb = vi.fn()
      await execute({ name: 'Dave' }, cb)

      expect(cb).toHaveBeenCalledTimes(2)
      expect(cb).toHaveBeenNthCalledWith(1, { message: 'hello Dave' })
      expect(cb).toHaveBeenNthCalledWith(2, { message: 'goodbye Dave' })
    })
  })
  describe('lifetime', () => {
    it('.times(n) allows exactly n uses', async () => {
      const emu = createEmulator<TestMethodMap>()
      emu.greet().times(2).reply({ message: 'ok' })

      const cb = vi.fn()
      await emu.handle('greet', { name: 'x' }, cb)
      await emu.handle('greet', { name: 'x' }, cb)

      await expect(
        emu.handle('greet', { name: 'x' }, vi.fn())
      ).rejects.toThrow()
    })
    it('.persist() is never consumed', async () => {
      const emu = createEmulator<TestMethodMap>()
      emu.greet().persist().reply({ message: 'always' })

      const cb = vi.fn()
      for (let i = 0; i < 5; i++) {
        await emu.handle('greet', { name: 'x' }, cb)
      }

      expect(cb).toHaveBeenCalledTimes(5)
    })
    it('.once() behaves like the default one-shot', async () => {
      const emu = createEmulator<TestMethodMap>()
      emu.greet().once().reply({ message: 'one' })

      await emu.handle('greet', { name: 'x' }, vi.fn())

      await expect(
        emu.handle('greet', { name: 'x' }, vi.fn())
      ).rejects.toThrow()
    })
    it('.twice() allows exactly two uses', async () => {
      const emu = createEmulator<TestMethodMap>()
      emu.greet().twice().reply({ message: 'two' })

      const cb = vi.fn()
      await emu.handle('greet', { name: 'x' }, cb)
      await emu.handle('greet', { name: 'x' }, cb)

      await expect(
        emu.handle('greet', { name: 'x' }, vi.fn())
      ).rejects.toThrow()
    })
    it('.thrice() allows exactly three uses', async () => {
      const emu = createEmulator<TestMethodMap>()
      emu.greet().thrice().reply({ message: 'three' })

      const cb = vi.fn()
      await emu.handle('greet', { name: 'x' }, cb)
      await emu.handle('greet', { name: 'x' }, cb)
      await emu.handle('greet', { name: 'x' }, cb)

      await expect(
        emu.handle('greet', { name: 'x' }, vi.fn())
      ).rejects.toThrow()
    })
  })
  describe('LIFO ordering', () => {
    it('the most recently registered responder wins', async () => {
      const emu = createEmulator<TestMethodMap>()
      emu.greet().persist().reply({ message: 'first' })
      emu.greet().persist().reply({ message: 'second' })

      const cb = vi.fn()
      await emu.handle('greet', { name: 'x' }, cb)

      expect(cb).toHaveBeenCalledExactlyOnceWith({ message: 'second' })
    })
    it('falls back to earlier responder once the later one is consumed', async () => {
      const emu = createEmulator<TestMethodMap>()
      emu.greet().persist().reply({ message: 'fallback' })
      emu.greet().once().reply({ message: 'override' })

      const first = vi.fn()
      const second = vi.fn()
      await emu.handle('greet', { name: 'x' }, first)
      await emu.handle('greet', { name: 'x' }, second)

      expect(first).toHaveBeenCalledExactlyOnceWith({ message: 'override' })
      expect(second).toHaveBeenCalledExactlyOnceWith({ message: 'fallback' })
    })
  })
  describe('filters', () => {
    it('skips responders whose filter does not match', async () => {
      const emu = createEmulator<TestMethodMap>()
      emu.greet().persist().reply({ message: 'default' })
      emu
        .greet(({ name }) => name === 'Alice')
        .persist()
        .reply({ message: 'hi Alice' })

      const alice = vi.fn()
      const bob = vi.fn()
      await emu.handle('greet', { name: 'Alice' }, alice)
      await emu.handle('greet', { name: 'Bob' }, bob)

      expect(alice).toHaveBeenCalledExactlyOnceWith({ message: 'hi Alice' })
      expect(bob).toHaveBeenCalledExactlyOnceWith({ message: 'default' })
    })
  })
  describe('.execute()', () => {
    it('returns the response directly without going through handle', async () => {
      const emu = createEmulator<TestMethodMap>()
      const { execute } = emu.add().reply(({ a, b }) => ({ result: a + b }))

      const result = await execute({ a: 3, b: 4 })

      expect(result).toEqual({ result: 7 })
    })
  })
  describe('no responder', () => {
    it('throws when no responder is registered for a method', async () => {
      const emu = createEmulator<TestMethodMap>()

      await expect(
        emu.handle('greet', { name: 'x' }, vi.fn())
      ).rejects.toThrow()
    })
  })
})
describe('disposable', () => {
  it('calls the dispose function when .dispose() is invoked', async () => {
    const emu = createEmulator<TestMethodMap>()
    const dispose = vi.fn()
    const wrapped = disposable(emu, dispose)

    await wrapped.dispose()

    expect(dispose).toHaveBeenCalledOnce()
  })
  it('exposes Symbol.dispose', () => {
    const emu = createEmulator<TestMethodMap>()
    const wrapped = disposable(emu, vi.fn())

    expect(typeof wrapped[Symbol.dispose]).toBe('function')
  })
  it('preserves the emulator API after wrapping', async () => {
    const emu = createEmulator<TestMethodMap>()
    const wrapped = disposable(emu, vi.fn())
    wrapped.greet().reply({ message: 'still works' })

    const cb = vi.fn()
    await wrapped.handle('greet', { name: 'x' }, cb)

    expect(cb).toHaveBeenCalledExactlyOnceWith({ message: 'still works' })
  })
})

describe('pending and reset', () => {
  describe('.pending', () => {
    it('is 0 when no responders are registered', () => {
      const emu = createEmulator<TestMethodMap>()
      expect(emu.greet().pending).toBe(0)
    })
    it('is 1 after a responder is registered', () => {
      const emu = createEmulator<TestMethodMap>()
      emu.greet().reply({ message: 'hello' })
      expect(emu.greet().pending).toBe(1)
    })
    it('is 0 after the responder is consumed', async () => {
      const emu = createEmulator<TestMethodMap>()
      emu.greet().reply({ message: 'hello' })
      await emu.handle('greet', { name: 'x' }, vi.fn())
      expect(emu.greet().pending).toBe(0)
    })
    it('counts multiple registered responders', () => {
      const emu = createEmulator<TestMethodMap>()
      emu.greet().reply({ message: 'first' })
      emu.greet().reply({ message: 'second' })
      expect(emu.greet().pending).toBe(2)
    })
    it('counts a .persist() responder as 1 regardless of call count', async () => {
      const emu = createEmulator<TestMethodMap>()
      emu.greet().persist().reply({ message: 'always' })
      await emu.handle('greet', { name: 'x' }, vi.fn())
      await emu.handle('greet', { name: 'x' }, vi.fn())
      expect(emu.greet().pending).toBe(1)
    })
    it('does not count responders on other methods', () => {
      const emu = createEmulator<TestMethodMap>()
      emu.greet().reply({ message: 'hello' })
      emu.add().reply({ result: 1 })
      expect(emu.greet().pending).toBe(1)
      expect(emu.add().pending).toBe(1)
    })
  })

  describe('method-level .reset()', () => {
    it('clears all responders for the method', () => {
      const emu = createEmulator<TestMethodMap>()
      emu.greet().reply({ message: 'hello' })
      emu.greet().reply({ message: 'world' })
      emu.greet().reset()
      expect(emu.greet().pending).toBe(0)
    })
    it('causes handle to throw after reset', async () => {
      const emu = createEmulator<TestMethodMap>()
      emu.greet().reply({ message: 'hello' })
      emu.greet().reset()
      await expect(
        emu.handle('greet', { name: 'x' }, vi.fn())
      ).rejects.toThrow()
    })
    it('does not affect responders on other methods', () => {
      const emu = createEmulator<TestMethodMap>()
      emu.greet().reply({ message: 'hello' })
      emu.add().reply({ result: 1 })
      emu.greet().reset()
      expect(emu.greet().pending).toBe(0)
      expect(emu.add().pending).toBe(1)
    })
  })

  describe('emulator-level .reset()', () => {
    it('clears all responders across all methods', () => {
      const emu = createEmulator<TestMethodMap>()
      emu.greet().reply({ message: 'hello' })
      emu.add().reply({ result: 1 })
      emu.reset()
      expect(emu.greet().pending).toBe(0)
      expect(emu.add().pending).toBe(0)
    })
    it('causes handle to throw for all methods after reset', async () => {
      const emu = createEmulator<TestMethodMap>()
      emu.greet().reply({ message: 'hello' })
      emu.add().reply({ result: 1 })
      emu.reset()
      await expect(
        emu.handle('greet', { name: 'x' }, vi.fn())
      ).rejects.toThrow()
      await expect(emu.handle('add', { a: 1, b: 2 }, vi.fn())).rejects.toThrow()
    })
    it('allows new responders to be registered after reset', async () => {
      const emu = createEmulator<TestMethodMap>()
      emu.greet().reply({ message: 'before' })
      emu.reset()
      emu.greet().reply({ message: 'after' })
      const cb = vi.fn()
      await emu.handle('greet', { name: 'x' }, cb)
      expect(cb).toHaveBeenCalledExactlyOnceWith({ message: 'after' })
    })
  })
})

describe('.stream()', () => {
  it('waitForCall() resolves after handle() is called', async () => {
    const emu = createEmulator<TestMethodMap>()
    const handle = emu.greet().stream(() => ({ message: 'initial' }))

    emu.handle('greet', { name: 'Alice' }, vi.fn())

    await handle.waitForCall()
    expect(handle.latestResponse).toEqual({ message: 'initial' })
  })

  it('sends the initial response via the transport cb', async () => {
    const emu = createEmulator<TestMethodMap>()
    const handle = emu.greet().stream(() => ({ message: 'initial' }))

    const transportCb = vi.fn()
    emu.handle('greet', { name: 'Alice' }, transportCb)

    await handle.waitForCall()
    expect(transportCb).toHaveBeenCalledExactlyOnceWith({ message: 'initial' })
  })

  it('initializer receives the request args', async () => {
    const emu = createEmulator<TestMethodMap>()
    const handle = emu.greet().stream(({ name }) => ({ message: `hi ${name}` }))

    const transportCb = vi.fn()
    emu.handle('greet', { name: 'Bob' }, transportCb)

    await handle.waitForCall()
    expect(handle.latestResponse).toEqual({ message: 'hi Bob' })
  })

  it('send() derives the next response and delivers it via the transport cb', async () => {
    const emu = createEmulator<TestMethodMap>()
    const handle = emu.greet().stream(() => ({ message: 'v1' }))

    const transportCb = vi.fn()
    emu.handle('greet', { name: 'Carol' }, transportCb)

    await handle.waitForCall()
    await handle.send((prev) => ({ message: `${prev.message} → v2` }))

    expect(transportCb).toHaveBeenCalledTimes(2)
    expect(transportCb).toHaveBeenNthCalledWith(2, { message: 'v1 → v2' })
    expect(handle.latestResponse).toEqual({ message: 'v1 → v2' })
  })

  it('send() before waitForCall() throws with a clear message', async () => {
    const emu = createEmulator<TestMethodMap>()
    const handle = emu.greet().stream(() => ({ message: 'initial' }))

    await expect(handle.send((p) => p)).rejects.toThrow(
      'No active stream — call waitForCall() first'
    )
  })

  it('latestResponse is undefined before waitForCall() resolves', () => {
    const emu = createEmulator<TestMethodMap>()
    const handle = emu.greet().stream(() => ({ message: 'initial' }))

    expect(handle.latestResponse).toBeUndefined()
  })

  it('hasBeenCalled is false before waitForCall() resolves', () => {
    const emu = createEmulator<TestMethodMap>()
    const handle = emu.greet().stream(() => ({ message: 'initial' }))

    expect(handle.hasBeenCalled).toBe(false)
  })

  it('hasBeenCalled is true after waitForCall() resolves', async () => {
    const emu = createEmulator<TestMethodMap>()
    const handle = emu.greet().stream(() => ({ message: 'initial' }))

    emu.handle('greet', { name: 'Alice' }, vi.fn())
    await handle.waitForCall()

    expect(handle.hasBeenCalled).toBe(true)
  })

  it('hasBeenCalled remains true after send()', async () => {
    const emu = createEmulator<TestMethodMap>()
    const handle = emu.greet().stream(() => ({ message: 'initial' }))

    emu.handle('greet', { name: 'Alice' }, vi.fn())
    await handle.waitForCall()
    await handle.send(() => ({ message: 'update' }))

    expect(handle.hasBeenCalled).toBe(true)
  })

  it('pending is 1 immediately after stream() registration', () => {
    const emu = createEmulator<TestMethodMap>()
    emu.greet().stream(() => ({ message: 'initial' }))
    expect(emu.greet().pending).toBe(1)
  })

  it('pending drops to 0 synchronously right after handle() is called (no await)', () => {
    const emu = createEmulator<TestMethodMap>()
    emu.greet().stream(() => ({ message: 'initial' }))
    expect(emu.greet().pending).toBe(1)
    emu.handle('greet', { name: 'x' }, vi.fn())
    // No await at all — if deletion is synchronous this must already be 0
    expect(emu.greet().pending).toBe(0)
  })

  it('pending drops to 0 after handle() consumes the one-shot responder', async () => {
    const emu = createEmulator<TestMethodMap>()
    const handle = emu.greet().stream(() => ({ message: 'initial' }))
    expect(emu.greet().pending).toBe(1)

    emu.handle('greet', { name: 'x' }, vi.fn())
    // Let the responder async body run (initial cb + queue push)
    await Promise.resolve()
    await Promise.resolve()

    expect(emu.greet().pending).toBe(0)
    expect(handle.hasBeenCalled).toBe(false) // waitForCall not yet called
  })

  it('hasBeenCalled is false even after handle() fires, until waitForCall() is called', async () => {
    const emu = createEmulator<TestMethodMap>()
    const handle = emu.greet().stream(() => ({ message: 'initial' }))

    emu.handle('greet', { name: 'x' }, vi.fn())
    await Promise.resolve()
    await Promise.resolve()

    expect(handle.hasBeenCalled).toBe(false)
    await handle.waitForCall()
    expect(handle.hasBeenCalled).toBe(true)
  })

  it('is consumed after one use by default', async () => {
    const emu = createEmulator<TestMethodMap>()
    const handle = emu.greet().stream(() => ({ message: 'initial' }))

    emu.handle('greet', { name: 'x' }, vi.fn())
    await handle.waitForCall()

    await expect(emu.handle('greet', { name: 'x' }, vi.fn())).rejects.toThrow()
  })

  it('.times(2): pending is 2 before any handle(), drops to 1 after first handle()', async () => {
    const emu = createEmulator<TestMethodMap>()
    emu
      .greet()
      .times(2)
      .stream(() => ({ message: 'v1' }))

    expect(emu.greet().pending).toBe(1) // 1 StoredResponder with remaining=2

    emu.handle('greet', { name: 'first' }, vi.fn())
    await Promise.resolve()
    await Promise.resolve()

    expect(emu.greet().pending).toBe(1) // still 1, remaining=1
  })

  it('.times(2): pending drops to 0 after second handle()', async () => {
    const emu = createEmulator<TestMethodMap>()
    const handle = emu
      .greet()
      .times(2)
      .stream(() => ({ message: 'v1' }))

    emu.handle('greet', { name: 'first' }, vi.fn())
    await handle.waitForCall()

    emu.handle('greet', { name: 'second' }, vi.fn())
    await Promise.resolve()
    await Promise.resolve()

    expect(emu.greet().pending).toBe(0)
  })

  it('.times(n) accepts n streams sequentially via waitForCall()', async () => {
    const emu = createEmulator<TestMethodMap>()
    const handle = emu
      .greet()
      .times(2)
      .stream(() => ({ message: 'v1' }))

    const cb1 = vi.fn()
    const cb2 = vi.fn()

    emu.handle('greet', { name: 'first' }, cb1)
    await handle.waitForCall()
    expect(handle.latestResponse).toEqual({ message: 'v1' })

    emu.handle('greet', { name: 'second' }, cb2)
    await handle.waitForCall()
    expect(handle.latestResponse).toEqual({ message: 'v1' })

    // Both transport callbacks received the initial response
    expect(cb1).toHaveBeenCalledExactlyOnceWith({ message: 'v1' })
    expect(cb2).toHaveBeenCalledExactlyOnceWith({ message: 'v1' })

    // Third request should be rejected
    await expect(
      emu.handle('greet', { name: 'third' }, vi.fn())
    ).rejects.toThrow()
  })

  it('waitForCall() rejects after timeoutMs when no request arrives', async () => {
    const emu = createEmulator<TestMethodMap>()
    const handle = emu.greet().stream(() => ({ message: 'initial' }))

    await expect(handle.waitForCall(50)).rejects.toThrow(
      'waitForCall() timed out after 50ms — no request arrived'
    )
  })

  it('send() after second waitForCall() targets the second stream', async () => {
    const emu = createEmulator<TestMethodMap>()
    const handle = emu
      .greet()
      .twice()
      .stream(() => ({ message: 'init' }))

    const cb1 = vi.fn()
    const cb2 = vi.fn()

    emu.handle('greet', { name: 'first' }, cb1)
    await handle.waitForCall()
    await handle.send(() => ({ message: 'update-1' }))

    emu.handle('greet', { name: 'second' }, cb2)
    await handle.waitForCall()
    await handle.send(() => ({ message: 'update-2' }))

    expect(cb1).toHaveBeenCalledTimes(2)
    expect(cb1).toHaveBeenNthCalledWith(2, { message: 'update-1' })

    expect(cb2).toHaveBeenCalledTimes(2)
    expect(cb2).toHaveBeenNthCalledWith(2, { message: 'update-2' })
  })
})
