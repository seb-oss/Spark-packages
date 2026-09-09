import { ansiPatterns } from './characters'
import type { StdoutReader } from './stdout-reader'
import { COMMAND_TIMEOUT } from './utils'

export const output = async (
  reader: StdoutReader,
  timeoutMs = COMMAND_TIMEOUT
): Promise<string> => {
  while (true) {
    const chunk = await Promise.race([
      reader.next(),
      new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error('Timeout waiting for output')),
          timeoutMs
        )
      }),
    ])

    const text = chunk.toString().replace(ansiPatterns.all, '').trim()
    if (text) return text
    // Empty after stripping ANSI (e.g. a bare cursor-movement chunk) —
    // keep reading the next chunk instead of resolving with nothing.
  }
}
