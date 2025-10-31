import type {
  Args,
  DocumentableType,
  Path,
  Property,
  RequestArgs,
} from '../types.js'
import { argsOptional } from './args.js'
import { AND, OR, rxProperVariable } from './common.js'

export const document = ({ title, description }: DocumentableType): string => {
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

export const documentClientPath = (path: Path, responses: string): string =>
  documentPath(
    path,
    responses,
    [param('url', 'string')],
    [param('opts', 'RequestOptions', true)]
  )

export const documentServerPath = (path: Path, responses: string): string =>
  documentPath(path, responses)

const documentPath = (
  path: Path,
  responses: string,
  argsBefore: string[] = [],
  argsAfter: string[] = []
): string => {
  const tokens: string[] = []

  tokens.push('/**')
  if (path.title) tokens.push(` * ${path.title}`)
  if (path.description) tokens.push(` * ${path.description}`)
  tokens.push(' *')
  tokens.push(...argsBefore)
  if (path.args) tokens.push(...documentArgs(path.args))
  tokens.push(...argsAfter)
  tokens.push(` * @returns {Promise<${responses}>}`)
  tokens.push(' */')

  return tokens.join('\n')
}

const documentArgs = (args: RequestArgs): string[] => {
  const tokens: string[] = []

  tokens.push(
    param(
      'args',
      'Object',
      argsOptional(args),
      'The arguments for the request.'
    )
  )

  // Path params
  tokens.push(...requestArgs(args.path, 'params', 'Path parameters'))
  // Query params
  tokens.push(...requestArgs(args.query, 'query', 'Query parameters'))
  // Headers
  tokens.push(...requestArgs(args.header, 'headers', 'Headers'))
  // Request body
  tokens.push(...requestArgs(args.body, 'body', 'Request body'))

  return tokens
}

const buildPath = (path: string, property: string): string =>
  rxProperVariable.test(property)
    ? `${path}.${property}`
    : `${path}["${property}"]`

const requestArgs = (
  args: Args | undefined,
  name: string,
  title: string
): string[] => {
  if (!args) return []

  const tokens: string[] = []
  const type = (args.allOf || []).map((e) => e.type).join(AND) || 'Object'
  tokens.push(
    param(
      buildPath('args', name),
      type,
      args.optional,
      `${title} for the request.`
    )
  )
  const properties = args.properties.flatMap((prop) =>
    requestProperty(buildPath('args', name), prop)
  )
  tokens.push(...properties)
  return tokens
}

const requestProperty = (path: string, property: Property): string[] => {
  const tokens: string[] = []

  const type = property.type.map((t) => t.type).join(OR)
  tokens.push(
    param(
      buildPath(path, property.name),
      type,
      property.optional,
      property.title,
      property.description
    )
  )

  return tokens
}

const param = (
  name: string,
  type: string,
  optional = false,
  title = '',
  description = ''
): string => {
  const tokens: string[] = []

  tokens.push(
    ` * @param {${type}} ${optional ? '[' : ''}${name}${optional ? ']' : ''}`
  )
  if (optional || title || description) {
    tokens.push(' -')
    if (optional) tokens.push(' Optional.')
    if (title) tokens.push(` ${title}`)
    if (description) tokens.push(` ${description}`)
  }

  return tokens.join('')
}
