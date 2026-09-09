import type { ChildProcess } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { describe, expect, it } from 'vitest'
import { output } from './output'
import { StdoutReader } from './stdout-reader'

describe('output', () => {
  it('rejects after timeoutMs when no output arrives', async () => {
    const stdout = new EventEmitter()
    const mockProcess = {
      stdout,
    } as unknown as ChildProcess
    const reader = new StdoutReader(mockProcess)

    await expect(output(reader, 50)).rejects.toThrow(
      'Timeout waiting for output'
    )
  })
})
