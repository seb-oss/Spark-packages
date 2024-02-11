import {
  ComponentsObject,
  HeaderObject,
  OperationObject,
  ParameterObject,
  ReferenceObject,
  RequestBodyObject,
  SchemaObject,
} from '@sebspark/openapi-core'
import { Args, ObjectType, RequestArgs } from '../types'
import { findRef, parseDocumentation, parseRef } from './common'
import { parseSchema } from './schema'

export const parseArgs = (
  path: OperationObject,
  components?: ComponentsObject
): RequestArgs | undefined => {
  // No parameters and no requestBody - no args
  if (!path.parameters?.length && !path.requestBody) return undefined

  const args: RequestArgs = {
    ...parseParameters(path.parameters, components),
    ...parseRequestBody(path.requestBody, components),
  }

  return args
}

const createArgs = (initializer: Partial<Args> = {}): Args => ({
  type: 'object',
  properties: [],
  optional: true,
  ...initializer,
})

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
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
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
