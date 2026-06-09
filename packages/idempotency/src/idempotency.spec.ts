import { setTimeout as sleep } from 'node:timers/promises'
import { MemRedis } from '@sebspark/memredis'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  IdempotencyConflictError,
  IdempotencyEndError,
  IdempotencyGuard,
} from './index'

describe('IdempotencyGuard', () => {
  let client: MemRedis

  beforeEach(() => {
    client = new MemRedis()
  })

  afterEach(async () => {
    await client.flushAll()
  })

  it('runs the function and returns its result', async () => {
    const guard = await IdempotencyGuard.create<string>('key:1', client)
    const result = await guard.run(async (end) => {
      end('result-value')
      return 'result-value'
    })
    expect(result).toBe('result-value')
  })

  it('stores the value in Redis when end() is called', async () => {
    const guard = await IdempotencyGuard.create<string>('key:2', client)
    await guard.run(async (end) => {
      end('stored-value')
      return 'stored-value'
    })
    // give the fire-and-forget write time to complete
    await sleep(10)
    const stored = await client.get('key:2')
    expect(stored).not.toBeNull()
  })

  it('aborts with IdempotencyConflictError if key already exists', async () => {
    const first = await IdempotencyGuard.create<string>('key:3', client)
    await first.run(async (end) => {
      end('first-result')
      return 'first-result'
    })
    await sleep(10)

    const second = await IdempotencyGuard.create<string>('key:3', client)
    await expect(
      second.run(async (end) => {
        end('second-result')
        return 'second-result'
      })
    ).rejects.toThrow(IdempotencyConflictError)
  })

  it('IdempotencyConflictError carries the value from the winning process', async () => {
    const first = await IdempotencyGuard.create<string>('key:4', client)
    await first.run(async (end) => {
      end('winning-value')
      return 'winning-value'
    })
    await sleep(10)

    const second = await IdempotencyGuard.create<string>('key:4', client)
    const error = await second
      .run(async (end) => {
        end('losing-value')
        return 'losing-value'
      })
      .catch((e) => e)

    expect(error).toBeInstanceOf(IdempotencyConflictError)
    expect(error.value).toBe('winning-value')
  })

  it('aborts concurrent guard via pub/sub when end() is called', async () => {
    const guardA = await IdempotencyGuard.create<string>('key:5', client)
    const guardB = await IdempotencyGuard.create<string>('key:5', client)

    const resultA = guardA.run(async (end) => {
      await sleep(10)
      end('from-a')
      return 'from-a'
    })

    const resultB = guardB
      .run(async (end) => {
        await sleep(50)
        end('from-b')
        return 'from-b'
      })
      .catch((e) => e)

    await expect(resultA).resolves.toBe('from-a')
    const errorB = await resultB
    expect(errorB).toBeInstanceOf(IdempotencyConflictError)
    expect(errorB.value).toBe('from-a')
  })

  it('aborts the signal when a concurrent guard wins', async () => {
    const guardA = await IdempotencyGuard.create<string>('key:6', client)
    const guardB = await IdempotencyGuard.create<string>('key:6', client)

    await guardA.run(async (end) => {
      end('from-a')
      return 'from-a'
    })
    await sleep(0)

    expect(guardB.signal.aborted).toBe(true)
  })

  it('fires the abort event on the signal when a concurrent guard wins', async () => {
    const guardA = await IdempotencyGuard.create<string>('key:6b', client)
    const guardB = await IdempotencyGuard.create<string>('key:6b', client)

    let abortFired = false
    guardB.signal.addEventListener('abort', () => {
      abortFired = true
    })

    await guardA.run(async (end) => {
      end('from-a')
      return 'from-a'
    })
    await sleep(0)

    expect(abortFired).toBe(true)
  })

  it('throws IdempotencyEndError if fn returns without calling end', async () => {
    const guard = await IdempotencyGuard.create<string>('key:7', client)
    await expect(guard.run(async () => 'forgot-to-end')).rejects.toThrow(
      IdempotencyEndError
    )
  })

  it('throws IdempotencyEndError if end is called twice', async () => {
    const guard = await IdempotencyGuard.create<string>('key:8', client)
    await expect(
      guard.run(async (end) => {
        end('first')
        end('second')
        return 'value'
      })
    ).rejects.toThrow(IdempotencyEndError)
  })

  it('rejects mid-flight when a competing guard wins between async steps', async () => {
    const guardA = await IdempotencyGuard.create<string>('key:10', client)
    const guardB = await IdempotencyGuard.create<string>('key:10', client)

    const steps: number[] = []

    guardA.run(async (end) => {
      await sleep(10)
      end('from-a')
      return 'from-a'
    })

    const errorB = await guardB
      .run(async (end) => {
        steps.push(1)
        await sleep(5) // step 2 starts before A wins
        steps.push(2)
        await sleep(20) // A wins during this sleep
        steps.push(3) // never reached
        end('from-b')
        return 'from-b'
      })
      .catch((e) => e)

    expect(steps).toEqual([1, 2])
    expect(errorB).toBeInstanceOf(IdempotencyConflictError)
    expect(errorB.value).toBe('from-a')
  })

  it('the return type and committed type can differ', async () => {
    type Order = { id: string; total: number }
    const guard = await IdempotencyGuard.create<Order, string>('key:9', client)
    const order = await guard.run(async (end) => {
      const result: Order = { id: 'abc', total: 100 }
      end(result.id)
      return result
    })
    expect(order).toEqual({ id: 'abc', total: 100 })
  })

  it('propagates an error thrown inside fn', async () => {
    const guard = await IdempotencyGuard.create<string>('key:11', client)
    await expect(
      guard.run(async () => {
        throw new Error('something went wrong')
      })
    ).rejects.toThrow('something went wrong')
  })

  it('rejects with IdempotencyConflictError when signal is already aborted before fn resolves', async () => {
    const guardA = await IdempotencyGuard.create<string>('key:12', client)
    const guardB = await IdempotencyGuard.create<string>('key:12', client)

    // A wins synchronously — aborts B's signal before B's fn has a chance to resolve
    guardA.run(async (end) => {
      end('from-a')
      return 'from-a'
    })
    await sleep(0) // let end()'s async write complete and signal fire

    // B's fn completes after the signal is already aborted
    const errorB = await guardB
      .run(async (end) => {
        end('from-b') // signal already aborted — this should still lose
        return 'from-b'
      })
      .catch((e) => e)

    expect(errorB).toBeInstanceOf(IdempotencyConflictError)
    expect(errorB.value).toBe('from-a')
  })
})
