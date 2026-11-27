import { setTimeout } from 'node:timers/promises'
import { describe, expect, it, vi } from 'vitest'
import { createStore } from './store'

// The entries behind the object live() returns. In production, messages and
// expired-key events call upsert, remove, expire and replaceAll; here the
// tests call them directly.

type Prefs = { userId: string; channels: string[] }

const anna: Prefs = { userId: 'anna', channels: ['push'] }
const bob: Prefs = { userId: 'bob', channels: ['email'] }

describe('the entries of a live collection', () => {
  it('returns null for an id it does not hold, like Redis', () => {
    const store = createStore<Prefs, 'userId'>('userId')

    expect(store.live.get('nobody')).toBeNull()
    expect(store.live.has('nobody')).toBe(false)
  })

  it('adds an entry it has not seen, and emits add', () => {
    const store = createStore<Prefs, 'userId'>('userId')
    const added: Prefs[] = []
    store.live.on('add', (entry) => added.push(entry))

    store.upsert(anna)

    expect(store.live.get('anna')).toEqual(anna)
    expect(added).toEqual([anna])
  })

  it('replaces an entry that changed, and emits update', () => {
    const store = createStore<Prefs, 'userId'>('userId')
    store.upsert(anna)
    const updated: Prefs[] = []
    store.live.on('update', (entry) => updated.push(entry))

    store.upsert({ userId: 'anna', channels: ['sms'] })

    expect(store.live.get('anna')).toEqual({
      userId: 'anna',
      channels: ['sms'],
    })
    expect(updated).toEqual([{ userId: 'anna', channels: ['sms'] }])
  })

  it('emits nothing for an entry identical to the one it holds', () => {
    const store = createStore<Prefs, 'userId'>('userId')
    store.upsert(anna)
    const onChange = vi.fn()
    store.live.on('change', onChange)

    store.upsert({ userId: 'anna', channels: ['push'] })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('removes a deleted entry, and emits delete with the id', () => {
    const store = createStore<Prefs, 'userId'>('userId')
    store.upsert(anna)
    const deleted: string[] = []
    store.live.on('delete', (id) => deleted.push(id))

    store.remove('anna')

    expect(store.live.has('anna')).toBe(false)
    expect(deleted).toEqual(['anna'])
  })

  it('removes an expired entry, and emits expired with the id', () => {
    const store = createStore<Prefs, 'userId'>('userId')
    store.upsert(anna)
    const expired: string[] = []
    const deleted: string[] = []
    store.live.on('expired', (id) => expired.push(id))
    store.live.on('delete', (id) => deleted.push(id))

    store.expire('anna')

    expect(store.live.has('anna')).toBe(false)
    expect(expired).toEqual(['anna'])
    expect(deleted).toEqual([])
  })

  it('emits nothing when removing or expiring an id it does not hold', () => {
    const store = createStore<Prefs, 'userId'>('userId')
    const onChange = vi.fn()
    store.live.on('change', onChange)

    store.remove('nobody')
    store.expire('nobody')

    expect(onChange).not.toHaveBeenCalled()
  })

  it('emits every add, update, delete and expired on change, with its type', () => {
    const store = createStore<Prefs, 'userId'>('userId')
    const changes: unknown[][] = []
    store.live.on('change', (type, payload) => changes.push([type, payload]))

    store.upsert(anna)
    store.upsert({ userId: 'anna', channels: ['sms'] })
    store.remove('anna')
    store.upsert(bob)
    store.expire('bob')

    expect(changes).toEqual([
      ['add', anna],
      ['update', { userId: 'anna', channels: ['sms'] }],
      ['delete', 'anna'],
      ['add', bob],
      ['expired', 'bob'],
    ])
  })

  it('after loading all entries again, emits only what differs from what it held', () => {
    const store = createStore<Prefs, 'userId'>('userId')
    store.upsert(anna)
    store.upsert(bob)
    const changes: unknown[][] = []
    store.live.on('change', (type, payload) => changes.push([type, payload]))

    // As after a reconnect: anna was deleted, bob changed, cecilia was added
    const cecilia = { userId: 'cecilia', channels: ['sms'] }
    store.replaceAll([{ userId: 'bob', channels: ['sms'] }, cecilia])

    expect(changes).toEqual([
      ['delete', 'anna'],
      ['update', { userId: 'bob', channels: ['sms'] }],
      ['add', cecilia],
    ])
  })

  it('calls a once listener only for the first event, and none after off', () => {
    const store = createStore<Prefs, 'userId'>('userId')
    const onceAdd = vi.fn()
    const onAdd = vi.fn()
    store.live.once('add', onceAdd)
    store.live.on('add', onAdd)
    store.live.off('add', onAdd)

    store.upsert(anna)
    store.upsert(bob)

    expect(onceAdd).toHaveBeenCalledTimes(1)
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('reports an error to its error listeners, or throws it when nobody listens', () => {
    const listened = createStore<Prefs, 'userId'>('userId')
    const errors: unknown[] = []
    listened.live.on('error', (error) => errors.push(error))
    const unlistened = createStore<Prefs, 'userId'>('userId')

    listened.fail(new Error('write refused'))

    expect(errors).toEqual([new Error('write refused')])
    expect(() => unlistened.fail(new Error('write refused'))).toThrow(
      'write refused'
    )
  })

  it('ignores changes and errors after close, and closes once', async () => {
    const onClose = vi.fn()
    const store = createStore<Prefs, 'userId'>('userId', onClose)
    store.upsert(anna)
    const onChange = vi.fn()
    store.live.on('change', onChange)

    await store.live.close()
    await store.live.close()
    store.upsert({ userId: 'anna', channels: ['sms'] })
    store.expire('anna')

    expect(store.live.get('anna')).toEqual(anna)
    expect(onChange).not.toHaveBeenCalled()
    expect(() => store.fail(new Error('write refused'))).not.toThrow()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('resolves a second close only when the first has finished', async () => {
    let finishClosing = () => {}
    const store = createStore<Prefs, 'userId'>(
      'userId',
      () =>
        new Promise<void>((resolve) => {
          finishClosing = resolve
        })
    )
    const resolved: string[] = []

    const first = store.live.close().then(() => resolved.push('first'))
    const second = store.live.close().then(() => resolved.push('second'))
    await setTimeout(0)
    expect(resolved).toEqual([])

    finishClosing()
    await Promise.all([first, second])
    expect(resolved).toEqual(['first', 'second'])
  })
})
