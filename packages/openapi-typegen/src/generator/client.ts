import type { Verb } from '@sebspark/openapi-core'
import type { Path } from '../types'
import { generateClientArgs } from './args'
import { OR, generateResponseBody, serializeValue } from './common'
import { documentClientPath } from './document'

export const generateClient = (name: string, paths: Path[]): string => {
  const groupedCalls: Partial<Record<Verb, string[]>> = {}
  for (const path of paths) {
    if (!groupedCalls[path.method]) {
      groupedCalls[path.method] = []
    }
    groupedCalls[path.method]?.push(generateCall(path))
  }
  const client: string[] = []

  const methods = Object.keys(groupedCalls).map(serializeValue).join(OR)
  client.push(`export type ${name}Client = Pick<BaseClient, ${methods}> & {`)

  // biome-ignore lint/complexity/noForEach: <explanation>
  Object.entries(groupedCalls).forEach(([method, calls]) => {
    client.push(`${method}: {`)
    client.push(...calls)
    client.push('}')
  })

  client.push('}')

  return client.join('\n')
}

const generateCall = (path: Path): string => {
  const responses = generateResponses(path)
  return `${documentClientPath(path, responses)}
  (
    url: '${path.url}', ${generateClientArgs(path.args)}opts?: RequestOptions,
  ): Promise<${responses}>`
}

const generateResponses = (path: Path): string =>
  Object.entries(path.responses)
    .filter(([code]) => Number.parseInt(code, 10) < 400)
    .map(([, type]) => generateResponseBody(type, false))
    .join(OR)
