import type { ChildProcess } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { styleText } from 'node:util'
import { describe, expect, it } from 'vitest'
import { input } from './input'
import { StdoutReader } from './stdout-reader'

const makeProcess = (onWrite?: (data: string) => void): ChildProcess => {
  const stdout = new EventEmitter()
  const stdin = {
    write: (data: string) => {
      onWrite?.(data)
    },
  }
  return { stdout, stdin } as unknown as ChildProcess
}

describe('input', () => {
  it('rejects after timeoutMs when no response arrives', async () => {
    const proc = makeProcess()
    const reader = new StdoutReader(proc)
    await expect(input(proc, reader, 'hello\n', 50)).rejects.toThrow(
      'Timeout waiting for input'
    )
  })

  it('resolves when a green tick is detected in the output', async () => {
    const proc = makeProcess()
    const reader = new StdoutReader(proc)
    const promise = input(proc, reader, '\n', 1000)
    // biome-ignore lint/suspicious/noExplicitAny: EventEmitter cast
    ;(proc.stdout as any).emit(
      'data',
      Buffer.from(styleText('green', '✔ done'))
    )
    await expect(promise).resolves.toBeUndefined()
  })

  it('preserves the remainder of a chunk that also contains the next prompt render after a green tick', async () => {
    const proc = makeProcess()
    const reader = new StdoutReader(proc)
    const promise = input(proc, reader, '\n', 1000)
    // Under load, the confirmation tick and the start of the next prompt's
    // render can arrive merged in a single stdout chunk. Realistically the
    // two renders are still separate lines (inquirer always ends a render
    // without leaving the cursor mid-line) — the confirmation's own message
    // is inside the same colored run as the tick, and the next prompt's
    // render starts fresh after a newline.
    const mergedChunk = `${styleText('green', '✔ done')}\n? next prompt`
    // biome-ignore lint/suspicious/noExplicitAny: EventEmitter cast
    ;(proc.stdout as any).emit('data', Buffer.from(mergedChunk))
    await expect(promise).resolves.toBeUndefined()

    const remainder = await reader.next()
    expect(remainder.toString()).toEqual('? next prompt')
  })

  it('does not requeue the confirmation line itself as if it were a separate message', async () => {
    const proc = makeProcess()
    const reader = new StdoutReader(proc)
    const promise = input(proc, reader, '\n', 1000)
    // The confirmation line commonly continues on the same line after the
    // tick (prompt message and/or echoed answer) — this is part of the
    // current render, not a merged next message, and must not be requeued.
    const chunk = styleText('green', '✔ select something option 3')
    // biome-ignore lint/suspicious/noExplicitAny: EventEmitter cast
    ;(proc.stdout as any).emit('data', Buffer.from(chunk))
    await expect(promise).resolves.toBeUndefined()

    // Nothing should have been requeued — a subsequent read on the same
    // reader must wait for genuinely new data rather than resolving with
    // leftover echo text.
    const nextPromise = reader.next()
    let resolved = false
    nextPromise.then(() => {
      resolved = true
    })
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(resolved).toBe(false)
  })

  it('rejects with the error message when a red error indicator is detected (no-color mode)', async () => {
    const proc = makeProcess()
    const reader = new StdoutReader(proc)
    const promise = input(proc, reader, '\n', 1000)
    // biome-ignore lint/suspicious/noExplicitAny: EventEmitter cast
    ;(proc.stdout as any).emit(
      'data',
      Buffer.from('> You must provide a value')
    )
    await expect(promise).rejects.toThrow('You must provide a value')
  })

  it('rejects with only the error message, excluding the help line that follows on the next line (no-color mode)', async () => {
    const proc = makeProcess()
    const reader = new StdoutReader(proc)
    const promise = input(proc, reader, '\n', 1000)
    // In no-color/piped mode there are no ANSI escape codes, so the error
    // message and the trailing help line are separated only by a newline.
    const errorChunk =
      '> At least one choice must be selected\n↑↓ navigate • space select • a all • i invert • ⏎ submit'
    // biome-ignore lint/suspicious/noExplicitAny: EventEmitter cast
    ;(proc.stdout as any).emit('data', Buffer.from(errorChunk))
    await expect(promise).rejects.toThrow(
      new Error('At least one choice must be selected')
    )
  })

  it('rejects with the error message when a red error indicator is detected (ANSI color mode)', async () => {
    const proc = makeProcess()
    const reader = new StdoutReader(proc)
    const promise = input(proc, reader, '\n', 1000)
    // Simulate what @inquirer/prompts emits: styleText('red', '> ' + message)
    // which is \x1b[31m> message\x1b[39m — NOT the same as including styleText('red', '> ')
    const errorChunk = '\x1b[31m> At least one choice must be selected\x1b[39m'
    // biome-ignore lint/suspicious/noExplicitAny: EventEmitter cast
    ;(proc.stdout as any).emit('data', Buffer.from(errorChunk))
    await expect(promise).rejects.toThrow(
      'At least one choice must be selected'
    )
  })
})
