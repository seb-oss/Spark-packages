import type { ChildProcess } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { describe, expect, it } from 'vitest'
import { StdoutReader } from './stdout-reader'

const makeProcess = (): { proc: ChildProcess; stdout: EventEmitter } => {
  const stdout = new EventEmitter()
  const proc = { stdout } as unknown as ChildProcess
  return { proc, stdout }
}

describe('StdoutReader', () => {
  it('resolves with a chunk that arrives after next() is called', async () => {
    const { proc, stdout } = makeProcess()
    const reader = new StdoutReader(proc)

    const promise = reader.next()
    stdout.emit('data', Buffer.from('hello'))

    await expect(promise).resolves.toEqual(Buffer.from('hello'))
  })

  it('resolves immediately with a chunk that arrived before next() was called', async () => {
    const { proc, stdout } = makeProcess()
    const reader = new StdoutReader(proc)

    // This is the core regression case: the old design attached a listener
    // only once a call started waiting, so data emitted beforehand (e.g. in
    // the gap between two calls) was silently dropped forever.
    stdout.emit('data', Buffer.from('hello'))

    await expect(reader.next()).resolves.toEqual(Buffer.from('hello'))
  })

  it('returns multiple chunks emitted before any next() calls in FIFO order', async () => {
    const { proc, stdout } = makeProcess()
    const reader = new StdoutReader(proc)

    stdout.emit('data', Buffer.from('first'))
    stdout.emit('data', Buffer.from('second'))
    stdout.emit('data', Buffer.from('third'))

    await expect(reader.next()).resolves.toEqual(Buffer.from('first'))
    await expect(reader.next()).resolves.toEqual(Buffer.from('second'))
    await expect(reader.next()).resolves.toEqual(Buffer.from('third'))
  })

  it('does not lose a chunk emitted in the gap between two next() calls', async () => {
    const { proc, stdout } = makeProcess()
    const reader = new StdoutReader(proc)

    await Promise.all([
      reader.next(),
      Promise.resolve().then(() => stdout.emit('data', Buffer.from('one'))),
    ])

    // Emitted after the first next() has already resolved, but before the
    // second next() call attaches any new wait state.
    stdout.emit('data', Buffer.from('two'))

    await expect(reader.next()).resolves.toEqual(Buffer.from('two'))
  })

  it('returns an unshifted chunk before any queued or future chunks', async () => {
    const { proc, stdout } = makeProcess()
    const reader = new StdoutReader(proc)

    stdout.emit('data', Buffer.from('queued'))
    reader.unshift(Buffer.from('unshifted'))

    await expect(reader.next()).resolves.toEqual(Buffer.from('unshifted'))
    await expect(reader.next()).resolves.toEqual(Buffer.from('queued'))
  })
})
