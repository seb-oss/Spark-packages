import { describe, expect, it, vi } from 'vitest'
import { callResponder } from './call-responder'
import type { StoredResponder } from './types'

type Args = { value: number }
type Resp = { result: number }

const makeResponder = (
  cb: StoredResponder<Args, Resp>['cb'],
  remaining = 1,
  filter?: StoredResponder<Args, Resp>['filter']
): StoredResponder<Args, Resp> => ({ cb, remaining, filter })

describe('callResponder', () => {
  it('throws when no responder is registered', async () => {
    const responders = new Set<StoredResponder<Args, Resp>>()
    await expect(
      callResponder('test', responders, { value: 1 }, vi.fn())
    ).rejects.toThrow('No responder found for .test')
  })

  it('invokes the registered responder with args and cb', async () => {
    const responders = new Set<StoredResponder<Args, Resp>>()
    const cb = vi.fn()
    responders.add(
      makeResponder(async (args, respond) =>
        respond({ result: args.value * 2 })
      )
    )

    await callResponder('test', responders, { value: 3 }, cb)

    expect(cb).toHaveBeenCalledExactlyOnceWith({ result: 6 })
  })

  it('removes a one-shot responder after use', async () => {
    const responders = new Set<StoredResponder<Args, Resp>>()
    responders.add(makeResponder(async (_args, cb) => cb({ result: 1 }), 1))

    await callResponder('test', responders, { value: 0 }, vi.fn())

    expect(responders.size).toBe(0)
  })

  it('does not remove a persist responder after use', async () => {
    const responders = new Set<StoredResponder<Args, Resp>>()
    responders.add(
      makeResponder(
        async (_args, cb) => cb({ result: 1 }),
        Number.POSITIVE_INFINITY
      )
    )

    await callResponder('test', responders, { value: 0 }, vi.fn())

    expect(responders.size).toBe(1)
  })

  it('decrements remaining on each use and removes at zero', async () => {
    const responders = new Set<StoredResponder<Args, Resp>>()
    responders.add(makeResponder(async (_args, cb) => cb({ result: 1 }), 2))

    await callResponder('test', responders, { value: 0 }, vi.fn())
    expect(responders.size).toBe(1)

    await callResponder('test', responders, { value: 0 }, vi.fn())
    expect(responders.size).toBe(0)
  })

  it('picks the most recently added responder (LIFO)', async () => {
    const responders = new Set<StoredResponder<Args, Resp>>()
    responders.add(
      makeResponder(
        async (_args, cb) => cb({ result: 1 }),
        Number.POSITIVE_INFINITY
      )
    )
    responders.add(
      makeResponder(
        async (_args, cb) => cb({ result: 2 }),
        Number.POSITIVE_INFINITY
      )
    )

    const cb = vi.fn()
    await callResponder('test', responders, { value: 0 }, cb)

    expect(cb).toHaveBeenCalledExactlyOnceWith({ result: 2 })
  })

  it('falls back to an earlier responder once the later one is consumed', async () => {
    const responders = new Set<StoredResponder<Args, Resp>>()
    responders.add(
      makeResponder(
        async (_args, cb) => cb({ result: 1 }),
        Number.POSITIVE_INFINITY
      )
    )
    responders.add(makeResponder(async (_args, cb) => cb({ result: 2 }), 1))

    const first = vi.fn()
    const second = vi.fn()
    await callResponder('test', responders, { value: 0 }, first)
    await callResponder('test', responders, { value: 0 }, second)

    expect(first).toHaveBeenCalledExactlyOnceWith({ result: 2 })
    expect(second).toHaveBeenCalledExactlyOnceWith({ result: 1 })
  })

  it('skips a responder whose filter does not match', async () => {
    const responders = new Set<StoredResponder<Args, Resp>>()
    responders.add(
      makeResponder(
        async (_args, cb) => cb({ result: 0 }),
        Number.POSITIVE_INFINITY
      )
    )
    responders.add(
      makeResponder(
        async (_args, cb) => cb({ result: 99 }),
        Number.POSITIVE_INFINITY,
        ({ value }) => value > 10
      )
    )

    const cb = vi.fn()
    await callResponder('test', responders, { value: 5 }, cb)

    expect(cb).toHaveBeenCalledExactlyOnceWith({ result: 0 })
  })

  it('uses a filtered responder when the filter matches', async () => {
    const responders = new Set<StoredResponder<Args, Resp>>()
    responders.add(
      makeResponder(
        async (_args, cb) => cb({ result: 0 }),
        Number.POSITIVE_INFINITY
      )
    )
    responders.add(
      makeResponder(
        async (_args, cb) => cb({ result: 99 }),
        Number.POSITIVE_INFINITY,
        ({ value }) => value > 10
      )
    )

    const cb = vi.fn()
    await callResponder('test', responders, { value: 20 }, cb)

    expect(cb).toHaveBeenCalledExactlyOnceWith({ result: 99 })
  })
})
