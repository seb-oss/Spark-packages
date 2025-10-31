import type { ChildProcess } from 'node:child_process'
import { keys } from './characters.js'
import { input } from './input.js'
import { COMMAND_DELAY, wait } from './utils.js'
import { write } from './write.js'

/**
 * Selects multiple options in a CLI checkbox menu.
 *
 * - Navigates to each specified option index and toggles it using the Space key.
 * - Keeps track of the current position to minimize unnecessary movement.
 * - After all options are toggled, presses Enter to confirm selection.
 * - If no options are specified, only Enter is pressed.
 *
 * @param childProcess - The running CLI process.
 * @param options - An array of option indices to toggle (0-based).
 * @returns A promise that resolves once the selection is confirmed.
 */
export const check = async (childProcess: ChildProcess, options: number[]) => {
  if (options.length === 0) {
    await input(childProcess, keys.enter)
    return
  }

  let currentPosition = 0 // Track current cursor position

  for (const option of options) {
    const moveBy = option - currentPosition

    if (moveBy > 0) {
      for (let i = 0; i < moveBy; i++) {
        await write(childProcess, keys.down)
        await wait(COMMAND_DELAY)
      }
    } else if (moveBy < 0) {
      for (let i = 0; i < Math.abs(moveBy); i++) {
        await write(childProcess, keys.up)
        await wait(COMMAND_DELAY)
      }
    }

    await write(childProcess, keys.space)
    await wait(COMMAND_DELAY)

    currentPosition = option // Update current position
  }

  await input(childProcess, keys.enter)
}
