import type { ChildProcess } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { styleText } from 'node:util'
import { describe, expect, it } from 'vitest'
import { input } from './input'

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
    await expect(input(makeProcess(), 'hello\n', 50)).rejects.toThrow(
      'Timeout waiting for input'
    )
  })

  it('resolves when a green tick is detected in the output', async () => {
    const proc = makeProcess()
    const promise = input(proc, '\n', 1000)
    // biome-ignore lint/suspicious/noExplicitAny: EventEmitter cast
    ;(proc.stdout as any).emit(
      'data',
      Buffer.from(styleText('green', '✔ done'))
    )
    await expect(promise).resolves.toBeUndefined()
  })

  it('rejects with the error message when a red error indicator is detected (no-color mode)', async () => {
    const proc = makeProcess()
    const promise = input(proc, '\n', 1000)
    // biome-ignore lint/suspicious/noExplicitAny: EventEmitter cast
    ;(proc.stdout as any).emit(
      'data',
      Buffer.from('> You must provide a value')
    )
    await expect(promise).rejects.toThrow('You must provide a value')
  })

  it('rejects with the error message when a red error indicator is detected (ANSI color mode)', async () => {
    const proc = makeProcess()
    const promise = input(proc, '\n', 1000)
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
