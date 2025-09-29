import type { SpawnOptions } from 'node:child_process'
import { spawn } from 'node:child_process'
import { keys } from './characters'
import { check } from './check'
import { input } from './input'
import { output } from './output'
import { parse } from './prompt'
import { select } from './select'
import type { CliTester, PromptType } from './types'

/**
 * Spawns a new CLI process and provides a set of methods to interact with it.
 *
 * - Supports running commands with or without arguments and options.
 * - Provides methods for **input, selection, capturing output, parsing prompts, and exiting**.
 * - Automatically **appends Enter (`\n`)** when sending input.
 * - Select interactions use **arrow key navigation** before confirming with Enter.
 * - Captures and strips ANSI characters from output.
 *
 * @overload
 * @param command - The command to run.
 * @returns A `CliTester` instance for interacting with the process.
 *
 * @overload
 * @param command - The command to run.
 * @param args - Arguments to pass to the command.
 * @returns A `CliTester` instance for interacting with the process.
 *
 * @overload
 * @param command - The command to run.
 * @param options - Spawn options for configuring the process.
 * @returns A `CliTester` instance for interacting with the process.
 *
 * @overload
 * @param command - The command to run.
 * @param args - Arguments to pass to the command.
 * @param options - Spawn options for configuring the process.
 * @returns A `CliTester` instance for interacting with the process.
 */
export function run(command: string): CliTester
export function run(command: string, args: string[]): CliTester
export function run(command: string, options: SpawnOptions): CliTester
export function run(
  command: string,
  args: string[],
  options: SpawnOptions
): CliTester

/**
 * Implementation of `run` function.
 *
 * @param command - The command to execute.
 * @param argsOrOptions - Either command arguments or spawn options.
 * @param maybeOptions - Additional spawn options if `argsOrOptions` is an array.
 * @returns A `CliTester` instance for interacting with the spawned process.
 */
export function run(
  command: string,
  argsOrOptions?: string[] | SpawnOptions,
  maybeOptions?: SpawnOptions
): CliTester {
  let args: string[]
  let options: SpawnOptions

  if (Array.isArray(argsOrOptions)) {
    args = argsOrOptions
    options = maybeOptions || {}
  } else {
    args = []
    options = argsOrOptions || {}
  }

  const childProcess = spawn(command, args, options)

  // Log all buffers
  // childProcess.stdout?.on('data', (chunk) => { console.log(Array.from(chunk).join(',')) })

  return {
    /**
     * Sends input to the CLI process, **appending Enter (`\n`) automatically**.
     *
     * @param text - The text to input. Defaults to an empty string (only sends Enter).
     * @returns A promise that resolves when input is processed.
     */
    input: async (text = '') => {
      await input(childProcess, `${text}${keys.enter}`)
    },

    /**
     * Selects an option in a CLI menu using arrow keys.
     *
     * - Moves down the given number of times before pressing Enter.
     * - If `optionNumber` is `0`, only Enter is pressed.
     *
     * @param optionNumber - The number of times to press the Down Arrow before Enter.
     * @returns A promise that resolves when the selection is made.
     */
    select: async (optionNumber: number) => {
      await select(childProcess, optionNumber)
    },

    /**
     * Selects multiple options in a CLI checkbox menu.
     *
     * - Moves down to each specified option and toggles it using the Space key.
     * - After all options are toggled, presses Enter to confirm the selection.
     * - If no options are specified, only Enter is pressed.
     *
     * @param options - An array of option indices to toggle (0-based).
     * @returns A promise that resolves once the selection is confirmed.
     */
    check: async (...options: number[]) => {
      await check(childProcess, options)
    },

    /**
     * Captures and returns the next available CLI output.
     *
     * - **Removes ANSI escape sequences** (e.g., colors, cursor movement).
     * - Resolves when a new prompt or text output is detected.
     *
     * @returns A promise resolving to the cleaned CLI output as a string.
     */
    output: async () => output(childProcess),

    /**
     * Captures and parses the next CLI prompt.
     *
     * - Reads from output.
     * - Strips leading `? ` characters and parentheses around default values.
     * - Parses the prompt type (`'input'` or `'select'`).
     * - If an expected type is provided, throws an Error if the parsed type does not match.
     *
     * @param expectedType - The expected prompt type (`'input'` or `'select'`). If provided and does not match, an Error is thrown.
     * @returns A promise resolving to the parsed `Prompt<T>`.
     * @throws If `expectedType` is specified but does not match the parsed prompt.
     */
    prompt: async <T extends PromptType | undefined = undefined>(
      expectedType?: T
    ) => {
      const message = await output(childProcess)
      return parse(message, expectedType)
    },

    /**
     * Exits the CLI process and resolves with its exit code.
     *
     * - If the CLI process terminates with an error, the promise is rejected with the exit code.
     *
     * @returns A promise resolving to the exit code of the CLI process.
     */
    exit: () =>
      new Promise<number>((resolve, reject) => {
        childProcess.on('exit', (code) => {
          if (code) reject(code)
          else resolve(code || 0)
        })
      }),

    /**
     * The underlying child process running the CLI.
     */
    process: childProcess,
  }
}
