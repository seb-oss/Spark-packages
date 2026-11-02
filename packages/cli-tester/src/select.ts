import type { ChildProcess } from 'node:child_process'
import { setTimeout } from 'node:timers/promises'
import { keys } from './characters'
import { input } from './input'
import type { StdoutReader } from './stdout-reader'
import { COMMAND_DELAY } from './utils'
import { write } from './write'

export const select = async (
  childProcess: ChildProcess,
  reader: StdoutReader,
  optionNumber: number
) => {
  for (let i = 0; i < optionNumber; i++) {
    await write(childProcess, keys.down)
    await setTimeout(COMMAND_DELAY)
  }
  await input(childProcess, reader, keys.enter)
}
