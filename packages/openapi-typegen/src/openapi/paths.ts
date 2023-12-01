import { Verb } from '@sebspark/openapi-core'
import { AddImportFn, Import } from '../shared/imports'
import {
  ReferenceObject,
  generateFromSchemaObject,
  parseRefString,
} from '../shared/schema'
import {
  ParameterObject,
  PathItemObject,
  RequestBody,
  ResponseObject,
} from './specification'
import { Response, Route } from './types'

export const pathGenerator = (
  globalParameters: Record<string, ParameterObject>
) => {
  const expressifyPath = (path: string): string =>
    path.replace(/{/g, ':').replace(/}/g, '')

  const parseResponse = (
    response: ResponseObject,
    addImports: AddImportFn
  ): string => {
    const schema = response.content?.['application/json']?.schema

    if (!schema) return ''
    return generateFromSchemaObject(schema, addImports)
  }

  const getType = (param: ParameterObject, addImport: AddImportFn): string => {
    if (param.type) param.type
    if (param.schema) {
      if ('type' in param.schema)
        return generateFromSchemaObject(param.schema, addImport)
    }
    return 'any'
  }

  const propName = (name?: string): string => {
    if (!name) return ''
    if (name.indexOf('-') === -1) return name
    return `'${name}'`
  }

  const generateProps = (
    params: Array<ReferenceObject | ParameterObject>,
    filter:
      | 'query'
      | 'header'
      | 'path'
      | /* V3 */ 'cookie'
      | /* V2 */ 'formData'
      | /* V2 */ 'body',
    addImport: AddImportFn
  ): string => {
    const props = params
      .map((it) => {
        if ('$ref' in it) {
          return globalParameters[it.$ref]
        }

        return it
      })
      .filter((p) => p.in === filter)
      .map(
        (p) =>
          `${propName(p.name)}${p.required ? '' : '?'}: ${getType(
            p,
            addImport
          )}`
      )

    if (props.length) return `{${props.join(', ')}}`

    return 'never'
  }

  const generateBody = (body: RequestBody, addImport: AddImportFn): string => {
    if (body?.content?.['application/json']) {
      const content = body.content['application/json']?.schema

      return generateFromSchemaObject(content, addImport)
    }

    return 'never'
  }

  const generateResponses = (
    responses: Record<string, ReferenceObject | ResponseObject> | undefined,
    addImport: AddImportFn,
    errors = false
  ): Response[] => {
    if (!responses) {
      console.warn('No responses found')
      return []
    }

    const responseTypes = Object.entries(responses)
      .map(([strCode, response]) => {
        const code = parseInt(strCode, 10)
        if (code >= 400 !== errors) return

        // ref type
        if ('$ref' in response) {
          return {
            code,
            type: parseRefString(response.$ref, addImport),
          }
        }

        // evaluated type
        return {
          code,
          type: parseResponse(response as ResponseObject, addImport) || 'void',
        }
      })
      .filter((r) => r) as Response[]

    return responseTypes
  }

  const generateRoutes = (
    path: string,
    item: PathItemObject,
    addImport: AddImportFn
  ): Route[] => {
    const verbs: Verb[] = ['get', 'post', 'put', 'patch', 'delete']

    const routes = verbs
      .map<Route | undefined>((verb) => {
        const operation = item[verb]
        if (!operation) return undefined

        const route: Route = {
          url: expressifyPath(path),
          method: verb,
          requestBody: generateBody(
            operation.requestBody as RequestBody,
            addImport
          ),
          requestParams: generateProps(
            operation.parameters || [],
            'path',
            addImport
          ),
          requestQuery: generateProps(
            operation.parameters || [],
            'query',
            addImport
          ),
          requestHeaders: generateProps(
            operation.parameters || [],
            'header',
            addImport
          ),
          response: generateResponses(operation.responses, addImport)[0],
          errorResponses: generateResponses(
            operation.responses,
            addImport,
            true
          ),
        }
        return route
      })
      .filter((r) => r) as Route[]

    return routes
  }

  const generatePaths = (
    paths: Record<string, PathItemObject>
  ): [Route[], Import[]] => {
    const imports = [] as Import[]
    const routes = Object.entries(paths).flatMap(([path, item]) =>
      generateRoutes(path, item, (imp) => imports.push(imp))
    )

    return [routes, imports]
  }

  return {
    generate: generatePaths,
  }
}
