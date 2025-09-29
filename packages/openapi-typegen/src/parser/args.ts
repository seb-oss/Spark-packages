import type {
  ComponentsObject,
  HeaderObject,
  OperationObject,
  ParameterObject,
  ReferenceObject,
  RequestBodyObject,
  SchemaObject,
  SecurityRequirementObject,
  SecuritySchemeObject,
} from '@sebspark/openapi-core'
import type { Args, ObjectType, RequestArgs } from '../types'
import { findRef, parseDocumentation, parseRef } from './common'
import { parseSchema } from './schema'

export const parseArgs = (
  path: OperationObject,
  components?: ComponentsObject
): RequestArgs | undefined => {
  // No parameters and no requestBody - no args
  if (!path.parameters?.length && !path.security?.length && !path.requestBody)
    return undefined

  const args: RequestArgs = joinArgs([
    parseParameters(path.parameters, components),
    parseSecurity(path.security, components),
    parseRequestBody(path.requestBody, components),
  ])

  return args
}

const createArgs = (initializer: Partial<Args> = {}): Args => ({
  type: 'object',
  properties: [],
  optional: true,
  ...initializer,
})

const joinArgs = (args: RequestArgs[]): RequestArgs => {
  const reqArg: RequestArgs = {}
  for (const arg of args) {
    for (const [prop, val] of Object.entries(arg)) {
      const key = prop as keyof RequestArgs
      if (reqArg[key]) {
        reqArg[key] = joinArg(reqArg[key] as Args, val)
      } else {
        reqArg[key] = val
      }
    }
  }
  return reqArg
}

const joinArg = (arg1: Args, arg2: Args): Args => {
  const arg: Args = {
    type: 'object',
    optional: arg1.optional && arg2.optional,
    properties: arg1.properties.concat(arg2.properties),
  }
  if (arg1.allOf || arg2.allOf)
    arg.allOf = (arg1.allOf || []).concat(arg2.allOf || [])
  if (arg1.anyOf || arg2.anyOf)
    arg.anyOf = (arg1.anyOf || []).concat(arg2.anyOf || [])
  if (arg1.oneOf || arg2.oneOf)
    arg.oneOf = (arg1.oneOf || []).concat(arg2.oneOf || [])

  if (arg1.description || arg2.description)
    arg.description = arg1.description || arg2.description
  if (arg1.title || arg2.title) arg.title = arg1.title || arg2.title

  return arg
}

const parseSecurity = (
  security: SecurityRequirementObject[] = [],
  components: ComponentsObject = {}
): RequestArgs => {
  const args: RequestArgs = {}
  for (const secReq of security) {
    for (const [name] of Object.entries(secReq)) {
      const param = findRef<SecuritySchemeObject>(
        components,
        `#/components/securitySchemes/${name}`
      )
      const arg = args.header || createArgs({ ...parseDocumentation(param) })
      arg.optional = false
      if (!arg.allOf) arg.allOf = []
      arg.allOf.push({ type: parseRef(name) })
      args.header = arg
    }
  }
  return args
}

const parseParameters = (
  parameters: (ParameterObject | ReferenceObject)[] = [],
  components: ComponentsObject = {}
): RequestArgs => {
  const args: RequestArgs = {}

  for (const p of parameters) {
    const ref = (p as ReferenceObject).$ref
    if (ref) {
      const part = ref.split('/')[2] as keyof ComponentsObject
      switch (part) {
        case 'parameters': {
          const param = findRef<ParameterObject>(components, ref)
          const arg =
            args[param.in] || createArgs({ ...parseDocumentation(param) })
          arg.optional = arg.optional && !param.required

          if (!arg.allOf) arg.allOf = []
          arg.allOf.push({ type: parseRef(ref) })

          args[param.in] = arg
          break
        }
        case 'headers': {
          const header = findRef<HeaderObject>(components, ref)
          const arg = args.header || createArgs()
          const name = parseRef(ref)
          arg.properties.push({
            name,
            optional: !header.required,
            // biome-ignore lint/style/noNonNullAssertion: schema is never null here
            type: [{ type: parseSchema(undefined, header.schema!).type }],
            ...parseDocumentation((header.schema || {}) as SchemaObject),
          })
          args.header = arg
          break
        }
      }
    } else {
      const param = p as ParameterObject
      const arg = args[param.in] || createArgs({ ...parseDocumentation(param) })

      arg.properties.push({
        name: param.name,
        optional: !param.required,
        type: [parseSchema(undefined, param.schema as SchemaObject)],
      })

      arg.optional = arg.optional && !param.required

      args[param.in] = arg
    }
  }

  return args
}

const parseRequestBody = (
  requestBody: ReferenceObject | RequestBodyObject | undefined,
  components: ComponentsObject = {}
): RequestArgs => {
  const args: RequestArgs = {}
  if (!requestBody) return args

  const ref = (requestBody as ReferenceObject).$ref
  if (ref) {
    const refBody = findRef<RequestBodyObject>(components, ref)
    args.body = createArgs({
      optional: !refBody.required,
      allOf: [{ type: parseRef(ref) }],
    })
  } else {
    // Inline request body properties
    const body = requestBody as RequestBodyObject
    const bodyArgs: Args =
      args.body ||
      createArgs({ optional: !body.required, ...parseDocumentation(body) })

    if (body.content['application/json']) {
      const schema = body.content['application/json'].schema
      if (schema) {
        const parsed = parseSchema(undefined, schema)
        if (parsed.type === 'object') {
          args.body = {
            ...(parsed as ObjectType),
            optional: !body.required,
          }
        } else if (parsed.type) {
          args.body = createArgs({
            optional: !body.required,
            allOf: [parsed],
            ...parseDocumentation(body),
          })
        }
      }
    }
    if (
      bodyArgs.allOf?.length ||
      bodyArgs.oneOf?.length ||
      bodyArgs.properties.length
    ) {
      args.body = bodyArgs
    }
  }

  return args
}
