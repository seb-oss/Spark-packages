import type { ChildProcess } from 'node:child_process'
import { styleText } from 'node:util'
import figures from '@inquirer/figures'
import { ansiPatterns } from './characters'
import { COMMAND_TIMEOUT } from './utils'

/**
 * Sends input to the CLI process and waits for confirmation.
 *
 * - **Always appends an Enter key (`\n`).**
 * - Resolves when a green checkmark (`✔`) is detected, indicating the input was accepted.
 * - Rejects with an error message if a red error indicator (`>` in red) is detected.
 * - Rejects if no response is received within **500ms** (timeout).
 *
 * @param childProcess - The child process running the CLI.
 * @param value - The text to send as input.
 * @returns A promise that resolves when the input is confirmed as accepted or rejects if an error occurs.
 * @throws If input is required but not provided, an error is captured from the CLI output.
 * @throws If no response is received within **500ms**, the promise rejects with a timeout error.
 */
export const input = (
  childProcess: ChildProcess,
  value: string,
  timeoutMs = COMMAND_TIMEOUT
) =>
  new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Timeout waiting for input')),
      timeoutMs
    )

    const inputListener = (chunk: Buffer) => {
      const greenProbe = styleText('green', '\x00')
      const [greenOpen] = greenProbe.split('\x00')
      const greenTickStart = `${greenOpen}${figures.tick}`
      if (chunk.includes(greenTickStart)) {
        // ✔ detected → Input was accepted
        clearTimeout(timeout)
        childProcess.stdout?.off('data', inputListener)
        return resolve()
      }

      const redProbe = styleText('red', '\x00')
      const [redOpen] = redProbe.split('\x00')
      const redErrorStart = `${redOpen}> `
      const chunkStr = chunk.toString()
      if (chunk.includes(redErrorStart) || chunkStr.startsWith('> ')) {
        // Detected cursor return for retry → capture and reject
        clearTimeout(timeout)
        childProcess.stdout?.off('data', inputListener)

        // Convert buffer to string and remove ANSI sequences
        const cleanText = chunkStr.replace(ansiPatterns.all, '').trim()

        // Extract text after the red error indicator ("> ")
        const errorMatch = />\s(.*)/.exec(chunkStr) // Match red "> " followed by text
        /* istanbul ignore else */
        if (errorMatch) {
          return reject(
            new Error(errorMatch[1].replace(ansiPatterns.all, '').trim())
          )
        } else {
          return reject(new Error(cleanText))
        }
      }
    }

    childProcess.stdout?.on('data', inputListener)
    childProcess.stdin?.write(value)
  })
