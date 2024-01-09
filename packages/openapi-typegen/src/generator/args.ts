import { RequestArgs } from '../types'
import { generateType } from './common'

export const generateClientArgs = (args: RequestArgs | undefined): string => (
  generateArgs(args, false)
)

export const generateServerArgs = (args: RequestArgs | undefined): string => (
  args ? generateArgs(args, true) : 'args: Req'
)

const generateArgs = (args: RequestArgs | undefined, extendsReq: boolean): string => {
  if (args) {
    const parts: (keyof RequestArgs)[] = ['body', 'header', 'path', 'query']
    const tokens: string[] = []
    for (const part of parts) {
      const arg = args[part]
      if (arg) {
        const partName = part === 'path' ? 'params' : part
        tokens.push(`${partName}${arg.optional ? '?' : ''}: ${generateType(arg)}`)
      }
    }

    if (!tokens.length) return ''

    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const  optional = parts.reduce((o, p) => (o && (!args[p] || args[p]!.optional)), true)
    return `args${optional ? '?': ''}: ${extendsReq ? 'Req & ' : ''}{ ${tokens.join(', ')} }, `
  }
  // No params - no args
  return ''
}