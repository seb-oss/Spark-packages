import type { ChildProcess } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { write } from './write'

describe('write', () => {
  it('resolves when stdin write succeeds', async () => {
    const mockProcess = {
      stdin: {
        write: (_text: string, callback: (err?: Error | null) => void) => {
          callback()
        },
      },
    } as unknown as ChildProcess

    await expect(write(mockProcess, 'hello')).resolves.toBeUndefined()
  })

  it('rejects when stdin write calls back with an error', async () => {
    const mockProcess = {
      stdin: {
        write: (_text: string, callback: (err?: Error | null) => void) => {
          callback(new Error('stdin write failed'))
        },
      },
    } as unknown as ChildProcess

    await expect(write(mockProcess, 'hello')).rejects.toThrow(
      'stdin write failed'
    )
  })
})
