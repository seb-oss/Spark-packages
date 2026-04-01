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
