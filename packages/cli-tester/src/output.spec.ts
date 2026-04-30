import type { ChildProcess } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { describe, expect, it } from 'vitest'
import { output } from './output'

describe('output', () => {
  it('rejects after timeoutMs when no output arrives', async () => {
    const stdout = new EventEmitter()
    const mockProcess = {
      stdout,
    } as unknown as ChildProcess

    await expect(output(mockProcess, 50)).rejects.toThrow(
      'Timeout waiting for output'
    )
  })
})
