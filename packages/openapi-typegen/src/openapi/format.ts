import { Verb } from '@sebspark/openapi-core'
import { formatTitle } from '../format'
import { Response, Route } from './types'
import { pascalCase } from 'change-case'

export const formatRoutes = (title: string, routes: Route[]): string[] => {
  const formattedTitle = formatTitle(title)
  const routeDefinitions = generateRouteDefinitions(routes)
  const server = generateServerAPI(formattedTitle, routeDefinitions)
  const client = generateClientAPI(formattedTitle, routeDefinitions)

  return server.concat(client)
}

const generateServerAPI = (name: string, routes: RouteDefinition[]) => {
  const map = generateServerType(routes)

  const rows: string[] = []
  rows.push(
    `export type ${name}Server = APIServerDefinition & {
${Object.entries(map)
  .map(
    ([url, methods]) =>
      `  '${url}': {
${Object.entries(methods)
  .map(
    ([method, definition]) => `    '${method}': {
    handler: (${serializeArgs(definition.args)}) => Promise<[${
      definition.response.code
    }, ${definition.response.type}]>
    pre?: GenericRouteHandler | GenericRouteHandler[]
  }`,
  )
  .join('\n')}
  },`,
  )
  .join('\n')}
}
`,
  )
  return rows
}

const generateClientAPI = (name: string, routes: RouteDefinition[]) => {
  const code: string[] = []
  const clientHandlers: string[] = []
  const verbMap = generateClientType(routes)
  Object.entries(verbMap).forEach(([verb, definitions]) => {
    const type = `${name}Client${pascalCase(verb)}`
    clientHandlers.push(`${verb}: ${type}`)

    code.push(`type ${type} = {`)
    definitions.forEach((def) => {
      const args = serializeArgs(def.args)
      const argsString = args ? `, ${args}` : ''
      code.push(
        `(url: '${def.url}'${argsString}): Promise<${def.response.type}>`,
      )
    })
    code.push('}')
  })
  code.push(`export type ${name}Client = BaseClient & {`)
  code.push(clientHandlers.join('\n'))
  code.push('}')
  return code
}

export const generateRouteDefinitions = (routes: Route[]): RouteDefinition[] =>
  routes.map((route) => ({
    method: route.method.toLowerCase() as Verb,
    response: route.response,
    url: route.url,
    args: parseArgs(route),
  }))

type RouteArgs = {
  params?: string
  query?: string
  headers?: string
  body?: string
}
export type RouteDefinition = {
  url: string
  method: Verb
  args?: RouteArgs
  response: Response
}
export type ServerRoute = Partial<Record<Verb, RouteDefinition>>
export type ServerRouter = Record<string, ServerRoute>

export type ClientRouter = Partial<Record<Verb, RouteDefinition[]>>

const generateClientType = (routes: RouteDefinition[]) =>
  routes.reduce<ClientRouter>((router, routeDefinition) => {
    if (!router[routeDefinition.method]) router[routeDefinition.method] = []
    router[routeDefinition.method]!.push(routeDefinition)
    return router
  }, {})

const generateServerType = (routes: RouteDefinition[]) =>
  routes.reduce<ServerRouter>((router, routeDefinition) => {
    const route = router[routeDefinition.url] || {}
    route[routeDefinition.method] = routeDefinition

    router[routeDefinition.url] = route
    return router
  }, {})

const parseArgs = (route: Route): RouteArgs | undefined => {
  const args: RouteArgs = {}
  if (route.requestParams !== 'never') args.params = route.requestParams
  if (route.requestQuery !== 'never') args.query = route.requestQuery
  if (route.requestHeaders !== 'never') args.headers = route.requestHeaders
  if (route.requestBody !== 'never') args.body = route.requestBody

  if (args.headers || args.params || args.query || args.body) return args
}

const serializeArgs = (args?: RouteArgs): string => {
  if (!args) return ''
  const argsString = Object.entries(args)
    .map(([key, value]) => `${key}: ${value}`)
    .join(',')
  return `args: {${argsString}}`
}
