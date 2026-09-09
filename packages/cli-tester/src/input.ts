import type { ChildProcess } from 'node:child_process'
import { styleText } from 'node:util'
import figures from '@inquirer/figures'
import { ansiPatterns } from './characters'
import type { StdoutReader } from './stdout-reader'
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
 * @param reader - The process's shared stdout reader (see {@link StdoutReader}).
 * @param value - The text to send as input.
 * @returns A promise that resolves when the input is confirmed as accepted or rejects if an error occurs.
 * @throws If input is required but not provided, an error is captured from the CLI output.
 * @throws If no response is received within **500ms**, the promise rejects with a timeout error.
 */
export const input = async (
  childProcess: ChildProcess,
  reader: StdoutReader,
  value: string,
  timeoutMs = COMMAND_TIMEOUT
): Promise<void> => {
  childProcess.stdin?.write(value)

  const greenProbe = styleText('green', '\x00')
  const [greenOpen] = greenProbe.split('\x00')
  const greenTickStart = `${greenOpen}${figures.tick}`

  const redProbe = styleText('red', '\x00')
  const [redOpen] = redProbe.split('\x00')
  const redErrorStart = `${redOpen}> `

  while (true) {
    const chunk = await Promise.race([
      reader.next(),
      new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error('Timeout waiting for input')),
          timeoutMs
        )
      }),
    ])

    if (chunk.includes(greenTickStart)) {
      // ✔ detected → Input was accepted. The confirmation line itself
      // normally continues after the tick on the same line (e.g. the
      // prompt message and/or the echoed answer: "✔ select something
      // option 3") — that trailing text belongs to *this* render, not a
      // separate message, and must not be requeued.
      //
      // Under load, this same physical chunk can *also* contain whatever
      // comes next (the next prompt's render, or the CLI's own output),
      // merged in before we got a chance to read it separately. Only the
      // first line after the tick is the confirmation's own trailing text;
      // everything from the first newline onward is genuinely separate
      // content and must always be requeued so callers don't lose it.
      const chunkStr = chunk.toString()
      const tickIndex = chunkStr.indexOf(greenTickStart)
      const remainder = chunkStr.slice(tickIndex + greenTickStart.length)
      const newlineIndex = remainder.indexOf('\n')
      if (newlineIndex !== -1) {
        const rest = remainder.slice(newlineIndex + 1)
        if (rest) reader.unshift(Buffer.from(rest))
      }
      return
    }

    const chunkStr = chunk.toString()
    if (chunk.includes(redErrorStart) || chunkStr.startsWith('> ')) {
      // Detected cursor return for retry → capture and reject

      // Extract text after the red error indicator ("> "), stopping at the
      // next ANSI escape sequence — a single stdout chunk can contain more
      // than one logical inquirer message (e.g. the error line followed by
      // the next prompt's re-render), joined by cursor-movement/color-reset
      // codes rather than a newline, so we must bound the match on the raw
      // (non-stripped) text before removing ANSI sequences.
      // biome-ignore lint/suspicious/noControlCharactersInRegex: \x1B (ESC) is the actual ANSI escape-sequence boundary we need to stop at
      const errorMatch = />\s([^\x1B\n]*)/.exec(chunkStr) // Match red "> " up to the next escape sequence or newline (no-color mode has no escape codes, so the help line that follows is newline-separated)
      /* istanbul ignore else */
      if (errorMatch) {
        throw new Error(errorMatch[1].replace(ansiPatterns.all, '').trim())
      } else {
        const cleanText = chunkStr.replace(ansiPatterns.all, '').trim()
        throw new Error(cleanText)
      }
    }

    // Neither a confirmation nor an error — keep reading the next chunk.
  }
}
