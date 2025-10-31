import type { ChildProcess } from 'node:child_process'
import { ansiPatterns } from './characters.js'
import { COMMAND_TIMEOUT } from './utils.js'

export const output = (
  childProcess: ChildProcess,
  timeoutMs = COMMAND_TIMEOUT
) =>
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
