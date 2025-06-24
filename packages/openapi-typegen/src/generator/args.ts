import type { RequestArgs } from '../types'
import { generateType } from './common'

export const generateClientArgs = (args: RequestArgs | undefined): string =>
  generateArgs(args, false)

export const generateServerArgs = (args: RequestArgs | undefined): string =>
  args ? generateArgs(args, true) : 'args: Req'

const parts: (keyof RequestArgs)[] = ['body', 'header', 'path', 'query']

const generateArgs = (
  args: RequestArgs | undefined,
  isServer: boolean
): string => {
  if (args) {
    const tokens: string[] = []
    for (const part of parts) {
      const arg = args[part]
      if (arg) {
        const partName =
          part === 'path' ? 'params' : part === 'header' ? 'headers' : part

        if (partName === 'query') {
          tokens.push(
            `${partName}${arg.optional ? '?' : ''}: Serialized<${generateType(arg)}>`
          )
        } else {
          tokens.push(
            `${partName}${arg.optional ? '?' : ''}: ${wrapArgs(
              generateType(arg),
              isServer && part === 'header'
            )}`
          )
        }
      }
    }

    if (!tokens.length) return ''

    const optional = argsOptional(args)
    return `args${optional ? '?' : ''}: ${
      isServer ? 'Req & ' : ''
    }{ ${tokens.join(', ')} }, `
  }
  // No params - no args
  return ''
}

const wrapArgs = (args: string, wrap: boolean): string => {
  if (!wrap) return args
  return `LowerCaseHeaders<${args}>`
}

export const argsOptional = (args: RequestArgs) =>
  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  parts.reduce((o, p) => o && (!args[p] || args[p]!.optional), true)
