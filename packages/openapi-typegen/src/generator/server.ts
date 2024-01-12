import { CustomType, Path, ResponseBody, TypeDefinition } from '../types'
import { generateServerArgs } from './args'
import { OR, generateResponseBody } from './common'
import { documentServerPath } from './document'

export const generateServer = (name: string, paths: Path[]): string => {
  const tokens: string[] = []

  tokens.push(`export type ${name}Server = APIServerDefinition & {`)

  for (const [url, methods] of Object.entries(groupPathsByUrl(paths))) {
    tokens.push(generatePath(url, methods))
  }

  tokens.push('}')

  return tokens.join('\n')
}

const groupPathsByUrl = (paths: Path[]): Record<string, Path[]> =>
  paths.reduce(
    (group, path) => {
      if (!group[path.url]) group[path.url] = []
      group[path.url].push(path)
      return group
    },
    {} as Record<string, Path[]>
  )

const generatePath = (url: string, methods: Path[]): string => `'${url}': {
    ${methods.map(generateMethod).join('\n')}
  }`

const generateMethod = (path: Path): string => {
  const responses = generateResponses(path.responses)
  return `${path.method}: {
      ${documentServerPath(path, responses)}
      handler: (${generateServerArgs(path.args)}) => Promise<${responses}>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }`
}

const generateResponses = (
  responses: Record<number, ResponseBody | CustomType>
): string =>
  Object.entries(responses)
    .filter(([code]) => parseInt(code, 10) < 400)
    .map(([code, response]) => generateResponse(parseInt(code, 10), response))
    .join(OR)

const generateResponse = (
  code: number,
  response: ResponseBody
): string => `[${code}, ${generateResponseBody(response)}]`

