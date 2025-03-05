import type {
  CheckboxPrompt,
  InputPrompt,
  Prompt,
  PromptType,
  SelectPrompt,
} from './types'

export const parse = <T extends PromptType = undefined>(
  text: string,
  expectedType?: T
): Prompt<T> => {
  const prompt = parseInput(text) || parseSelect(text) || parseCheckbox(text)
  if (!prompt) throw new Error(`Unknown prompt format "${text}"`)

  if (expectedType && prompt.type !== expectedType) {
    throw new Error(`Expected a ${expectedType} prompt but got ${prompt.type}`)
  }

  // Ensure TypeScript correctly infers the return type
  // biome-ignore lint/suspicious/noExplicitAny:
  return prompt as any
}

const parseInput = (prompt: string): InputPrompt | undefined => {
  const match = prompt.match(/^\?\s+(.+?)(?:\s+\((.*?)\))?$/)
  if (!match) return undefined

  const [, message, defaultValue] = match
  return {
    type: 'input',
    default: defaultValue,
    message,
  }
}

const parseSelect = (prompt: string): SelectPrompt | undefined => {
  const match = prompt.match(
    /^\?\s+(.+?)\s+\(Use arrow keys\)\n(?:\s*❯\s*(.+)\n)?([\s\S]*)$/
  )
  if (!match) return undefined

  const [, message, firstOption, otherOptions] = match
  const options = [
    firstOption,
    ...otherOptions.split('\n').map((o) => o.trim()),
  ].filter(Boolean)
  return {
    type: 'select',
    message,
    options,
  }
}

const parseCheckbox = (prompt: string): CheckboxPrompt | undefined => {
  const match = prompt.match(
    /^\?\s+(.+?)\s*(?:\((?:[^)]+)\))?\n(?:\s*❯?\s*[◯◉]\s*(.+)\n)?([\s\S]*)$/
  )
  if (!match) return undefined

  const [, message, firstOption = '', otherOptions = ''] = match
  const options = [firstOption, ...otherOptions.split('\n')]
    .map((o) => o.replace(/^\s*[◯◉]\s*/, '').trim()) // Strips the selection icons
    .filter(Boolean) // Remove any empty entries

  return {
    type: 'checkbox',
    message: message.trim(), // Ensures we don't include instructions
    options,
  }
}
