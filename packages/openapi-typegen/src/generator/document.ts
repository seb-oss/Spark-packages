import { Args, DocumentableType, Path, Property, RequestArgs } from '../types'
import { argsOptional } from './args'
import { OR } from './common'

export const document = ({title, description}: DocumentableType): string => {
  if (title || description) {
    const tokens: string[] = []
    tokens.push('/**')
    if (title) tokens.push(` * ${title}`)
    if (description) tokens.push(` * ${description}`)
    tokens.push(' */\n')
    return tokens.join('\n')
  }
  return ''
}

export const documentPath = (path: Path, responses: string): string => {
  const tokens: string[] = []

  tokens.push('/**')
  if (path.title) tokens.push(` * ${path.title}`)
  if (path.description) tokens.push(` * ${path.description}`)
  tokens.push(' *')
  tokens.push(param('url', 'string'))
  if (path.args) tokens.push(...documentArgs(path.args))
  tokens.push(param('opts', 'RequestOptions', true))
  tokens.push(` * @returns {Promise<${responses}>}`)
  tokens.push(' */')

  return tokens.join('\n')
}

const documentArgs = (args: RequestArgs): string[] => {
  const tokens: string[] = []

  tokens.push(param('args', 'Object', argsOptional(args), 'The arguments for the request.'))
  
  // Path params
  tokens.push(...requestArgs(args.path, 'params', 'Path parameters'))
  // Query params
  tokens.push(...requestArgs(args.query, 'query', 'Query parameters'))
  // Headers
  tokens.push(...requestArgs(args.header, 'header', 'Headers'))
  // Request body
  tokens.push(...requestArgs(args.body, 'body', 'Request body'))

  return tokens
}

const requestArgs = (args: Args | undefined, name: string, title: string): string[] => {
  if (!args) return []

  const tokens: string[] = []
  tokens.push(param(`args.${name}`, 'Object', args.optional, `${title} for the request.`))
  const properties = args.properties.flatMap((prop) => requestProperty(`args.${name}`, prop))
  tokens.push(...properties)
  return tokens
}

const requestProperty = (path: string, property: Property): string[] => {
  const tokens: string[] = []

  const type = property.type.map(t => t.type).join(OR)
  tokens.push(param(`${path}.${property.name}`, type, property.optional, property.title, property.description))

  return tokens
}

const param = (name: string, type: string, optional = false, title = '', description = ''): string => {
  const tokens: string[] = []

  tokens.push(` * @param {${type}} ${optional ? '[' : ''}${name}${optional ? ']' : ''}`)
  if (optional || title || description) {
    tokens.push(' -')
    if (optional) tokens.push(' Optional.')
    if (title) tokens.push(` ${title}`)
    if (description) tokens.push(` ${description}`)
  }

  return tokens.join('')
}
