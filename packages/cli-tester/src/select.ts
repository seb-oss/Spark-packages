import type { ChildProcess } from 'node:child_process'
import { keys } from './characters'
import { input } from './input'
import { COMMAND_DELAY, wait } from './utils'

export const select = async (
  childProcess: ChildProcess,
  optionNumber: number
) => {
  for (let i = 0; i < optionNumber; i++) {
    input(childProcess, keys.down)
    await wait(COMMAND_DELAY)
  }
  await input(childProcess, keys.enter)
}
