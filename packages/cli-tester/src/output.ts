import type { ChildProcess } from 'node:child_process'
import { ansiPatterns } from './characters'

export const output = (childProcess: ChildProcess, timeoutMs = 5000) =>
  new Promise<string>((resolve, reject) => {
    // Reject on timeout
    const timeout = setTimeout(
      () => reject(new Error('Timeout waiting for output')),
      timeoutMs
    )

    const listener = (chunk: Buffer) => {
      const text = chunk.toString().replace(ansiPatterns.all, '').trim()
      if (text) {
        childProcess.stdout?.off('data', listener)
        clearTimeout(timeout)
        resolve(text)
      }
    }
    childProcess.stdout?.on('data', listener)
  })
