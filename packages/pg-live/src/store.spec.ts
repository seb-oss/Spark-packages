import { setTimeout } from 'node:timers/promises'
import { describe, expect, it, vi } from 'vitest'
import { createStore } from './store'

// The rows behind the object live() returns. In production, notifications
// call upsert, remove and replaceAll; here the tests call them directly.

type Prefs = { user_id: string; channels: string[] }

const anna: Prefs = { user_id: 'anna', channels: ['push'] }
const bob: Prefs = { user_id: 'bob', channels: ['email'] }

describe('the rows of a live table', () => {
  it('adds a row it has not seen, and emits add', () => {
    const store = createStore<Prefs, 'user_id'>('user_id')
    const added: Prefs[] = []
    store.live.on('add', (row) => added.push(row))

    store.upsert(anna)

    expect(store.live.get('anna')).toEqual(anna)
    expect(added).toEqual([anna])
  })

  it('replaces a row that changed, and emits update', () => {
    const store = createStore<Prefs, 'user_id'>('user_id')
    store.upsert(anna)
    const updated: Prefs[] = []
    store.live.on('update', (row) => updated.push(row))

    store.upsert({ user_id: 'anna', channels: ['sms'] })

    expect(store.live.get('anna')).toEqual({
      user_id: 'anna',
      channels: ['sms'],
    })
    expect(updated).toEqual([{ user_id: 'anna', channels: ['sms'] }])
  })

  it('emits nothing for a row identical to the one it holds', () => {
    const store = createStore<Prefs, 'user_id'>('user_id')
    store.upsert(anna)
    const onChange = vi.fn()
    store.live.on('change', onChange)

    store.upsert({ user_id: 'anna', channels: ['push'] })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('removes a row by key, and emits delete with the key', () => {
    const store = createStore<Prefs, 'user_id'>('user_id')
    store.upsert(anna)
    const deleted: string[] = []
    store.live.on('delete', (userId) => deleted.push(userId))

    store.remove('anna')

    expect(store.live.has('anna')).toBe(false)
    expect(deleted).toEqual(['anna'])
  })

  it('emits nothing when removing a key it does not hold', () => {
    const store = createStore<Prefs, 'user_id'>('user_id')
    store.upsert(anna)
    const onChange = vi.fn()
    store.live.on('change', onChange)

    store.remove('nobody')

    expect(onChange).not.toHaveBeenCalled()
  })

  it('emits every add, update and delete on change, with its type', () => {
    const store = createStore<Prefs, 'user_id'>('user_id')
    const changes: unknown[][] = []
    store.live.on('change', (type, payload) => changes.push([type, payload]))

    store.upsert(anna)
    store.upsert({ user_id: 'anna', channels: ['sms'] })
    store.remove('anna')

    expect(changes).toEqual([
      ['add', anna],
      ['update', { user_id: 'anna', channels: ['sms'] }],
      ['delete', 'anna'],
    ])
  })

  it('after loading all rows again, emits only what differs from what it held', () => {
    const store = createStore<Prefs, 'user_id'>('user_id')
    store.upsert(anna)
    store.upsert(bob)
    const changes: unknown[][] = []
    store.live.on('change', (type, payload) => changes.push([type, payload]))

    // As after a reconnect: anna was deleted, bob changed, cecilia was added
    const cecilia = { user_id: 'cecilia', channels: ['sms'] }
    store.replaceAll([{ user_id: 'bob', channels: ['sms'] }, cecilia])

    expect(changes).toEqual([
      ['delete', 'anna'],
      ['update', { user_id: 'bob', channels: ['sms'] }],
      ['add', cecilia],
    ])
  })

  it('calls a once listener only for the first event', () => {
    const store = createStore<Prefs, 'user_id'>('user_id')
    const onAdd = vi.fn()
    store.live.once('add', onAdd)

    store.upsert(anna)
    store.upsert(bob)

    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it('stops calling a listener after off', () => {
    const store = createStore<Prefs, 'user_id'>('user_id')
    const onAdd = vi.fn()
    store.live.on('add', onAdd)

    store.live.off('add', onAdd)
    store.upsert(anna)

    expect(onAdd).not.toHaveBeenCalled()
  })

  it('ignores changes after close', async () => {
    const store = createStore<Prefs, 'user_id'>('user_id')
    store.upsert(anna)
    const onChange = vi.fn()
    store.live.on('change', onChange)

    await store.live.close()
    store.upsert({ user_id: 'anna', channels: ['sms'] })
    store.remove('anna')

    expect(store.live.get('anna')).toEqual(anna)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('runs its close callback once, however often close is called', async () => {
    const onClose = vi.fn()
    const store = createStore<Prefs, 'user_id'>('user_id', onClose)

    await store.live.close()
    await store.live.close()

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('resolves a second close only when the first has finished', async () => {
    let finishClosing = () => {}
    const store = createStore<Prefs, 'user_id'>(
      'user_id',
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

  it('reports an error to its error listeners', () => {
    const store = createStore<Prefs, 'user_id'>('user_id')
    const errors: unknown[] = []
    store.live.on('error', (error) => errors.push(error))

    store.fail(new Error('connection lost'))

    expect(errors).toEqual([new Error('connection lost')])
  })

  it('throws an error when nobody listens for it', () => {
    const store = createStore<Prefs, 'user_id'>('user_id')

    expect(() => store.fail(new Error('connection lost'))).toThrow(
      'connection lost'
    )
  })

  it('reports no errors after close', async () => {
    const store = createStore<Prefs, 'user_id'>('user_id')
    await store.live.close()

    expect(() => store.fail(new Error('connection lost'))).not.toThrow()
  })
})
