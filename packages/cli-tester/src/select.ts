import type { ChildProcess } from 'node:child_process'
import { keys } from './characters'
import { input } from './input'
import type { StdoutReader } from './stdout-reader'
import { COMMAND_DELAY, wait } from './utils'
import { write } from './write'

export const select = async (
  childProcess: ChildProcess,
  reader: StdoutReader,
  optionNumber: number
) => {
  for (let i = 0; i < optionNumber; i++) {
    await write(childProcess, keys.down)
    await wait(COMMAND_DELAY)
  }
  await input(childProcess, reader, keys.enter)
}
