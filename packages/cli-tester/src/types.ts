import type { ChildProcess } from 'node:child_process'

/**
 * Supported types of CLI prompts.
 */
export type PromptType = 'input' | 'select' | 'checkbox' | undefined

/**
 * Base structure for CLI prompts.
 */
type BasePrompt = {
  /**
   * The type of prompt (`'input'` or `'select'`).
   */
  type: PromptType

  /**
   * The message displayed by the prompt.
   */
  message: string
}

/**
 * Represents an input prompt.
 */
export type InputPrompt = BasePrompt & {
  type: 'input'

  /**
   * The default value displayed in parentheses (if provided).
   */
  default?: string
}

/**
 * Represents a select prompt.
 */
export type SelectPrompt = BasePrompt & {
  type: 'select'

  /**
   * The available options in the select menu.
   */
  options: string[]
}

/**
 * Represents a checkbox prompt.
 */
export type CheckboxPrompt = BasePrompt & {
  type: 'checkbox'

  /**
   * The available options in the checkbox menu.
   */
  options: string[]
}

/**
 * A utility type that returns the appropriate prompt type based on `T`.
 *
 * - If `T` is `'input'`, returns `InputPrompt`.
 * - If `T` is `'select'`, returns `SelectPrompt`.
 * - If `T` is `'checkbox'`, returns `CheckboxPrompt`.
 * - If `T` is `undefined`, returns `BasePrompt`.
 */
export type Prompt<T extends PromptType | undefined = undefined> =
  T extends 'input'
    ? InputPrompt
    : T extends 'select'
      ? SelectPrompt
      : T extends 'checkbox'
        ? CheckboxPrompt
        : BasePrompt

/**
 * CLI Tester interface for interacting with a command-line interface in tests.
 */
export type CliTester = {
  /**
   * Sends input to the CLI process.
   *
   * - **Always appends an Enter key (`\n`).**
   * - If no value is provided, only Enter is sent.
   * - If input is required and no value is passed, an Error will be thrown.
   *
   * @param text - The text to send as input (optional).
   * @returns A promise that resolves once the input is processed.
   * @throws If input is required but no value is provided.
   */
  input: (text?: string) => Promise<void>

  /**
   * Selects an option in a CLI menu using arrow keys.
   *
   * - Moves down the given number of times before pressing Enter.
   * - If `optionNumber` is `0`, only Enter is pressed.
   *
   * @param optionNumber - The number of times to press the Down Arrow before Enter.
   * @returns A promise that resolves once the selection is made.
   */
  select: (optionNumber: number) => Promise<void>

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
  check: (...options: number[]) => Promise<void>

  /**
   * Captures the next available CLI output.
   *
   * - Removes ANSI special characters (color codes, cursor movement, etc.).
   * - Resolves when a new prompt or text output is detected.
   *
   * @returns A promise resolving to the cleaned CLI output as a string.
   */
  output: () => Promise<string>

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
  prompt: <T extends PromptType = undefined>(
    expectedType?: T
  ) => Promise<Prompt<T>>

  /**
   * Exits the CLI process and resolves with its exit code.
   *
   * - If the CLI process terminates with an error, the promise is rejected with the exit code.
   *
   * @returns A promise resolving to the exit code of the CLI process.
   */
  exit: () => Promise<number>

  /**
   * The underlying child process running the CLI.
   */
  process: ChildProcess
}
