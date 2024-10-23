import {
  ZodArray,
  ZodBigInt,
  ZodBoolean,
  ZodDate,
  ZodEnum,
  ZodNullable,
  ZodNumber,
  ZodObject,
  ZodOptional,
  type ZodRawShape,
  ZodString,
  type ZodTypeAny,
  ZodUnion,
} from 'zod'
import { match, P } from 'ts-pattern'
import type { schema } from 'avsc'

export const zodToAvro = (
  name: string,
  zodType: ZodTypeAny,
  options?: { namespace: string },
  cache: Map<ZodTypeAny, string> = new Map()
): schema.AvroSchema => {
  const fqn = `${options?.namespace}.${name}`
  if (cache.has(zodType)) {
    return cache.get(zodType) as schema.AvroSchema
  }
  const retval = match<{ value: ZodTypeAny }, schema.AvroSchema>({
    value: zodType,
  })
    .with({ value: P.instanceOf(ZodOptional) }, (zodObject) => {
      return Array.from(
        new Set(
          [
            'null',
            zodToAvro(name, zodObject.value.unwrap(), options, cache),
          ].flat()
        )
      ) as schema.AvroSchema
    })
    .with({ value: P.instanceOf(ZodNullable) }, (zodObject) => {
      return Array.from(
        new Set(
          [
            'null',
            zodToAvro(name, zodObject.value.unwrap(), options, cache),
          ].flat()
        )
      ) as schema.AvroSchema
    })
    .with({ value: P.instanceOf(ZodObject<ZodRawShape>) }, (zodObject) => {
      cache.set(zodObject.value, fqn)
      return parseZodObjectToAvscRecord(name, zodObject.value, cache, options)
    })
    .with({ value: P.instanceOf(ZodString) }, () => {
      return 'string'
    })
    .with({ value: P.instanceOf(ZodUnion) }, (zodUnion) => {
      return Array.from(
        new Set(
          zodUnion.value.options.flatMap((zodType) =>
            zodToAvro(name, zodType, options, cache)
          )
        )
      )
    })
    .with({ value: P.instanceOf(ZodEnum) }, (zodEnum) => {
      cache.set(zodEnum.value, fqn)
      return {
        name,
        type: 'enum',
        symbols: zodEnum.value.options,
        doc: zodEnum.value.description,
        namespace: options?.namespace,
      }
    })
    .with({ value: P.instanceOf(ZodNumber) }, () => {
      return 'double'
    })
    .with({ value: P.instanceOf(ZodDate) }, () => {
      return 'long'
    })
    .with({ value: P.instanceOf(ZodArray) }, (zodArray) => {
      return {
        type: 'array',
        items: zodToAvro(
          `${name}-value`,
          zodArray.value._def.type,
          options,
          cache
        ),
      }
    })
    .with({ value: P.instanceOf(ZodBigInt) }, () => {
      return 'long'
    })
    .with({ value: P.instanceOf(ZodBoolean) }, () => {
      return 'boolean'
    })
    .otherwise((v) => {
      throw new Error(`Unsupported type ${v}`)
    })
  return retval
}

const parseZodObjectToAvscRecord = (
  name: string,
  zodObject: ZodObject<ZodRawShape>,
  cache: Map<ZodTypeAny, string>,
  options?: { namespace: string }
): schema.RecordType => {
  const shape = zodObject.shape
  const fields = Object.entries(shape).map((k) => {
    const type = zodToAvro(k[0], k[1], options, cache)
    const name = k[0]
    const doc = k[1].description
    const fieldDef: schema.RecordType['fields'][number] = { name, type, doc }
    if (type === 'null' || (Array.isArray(type) && type.includes('null'))) {
      fieldDef.default = null
    }
    return fieldDef
  })
  return {
    name,
    type: 'record',
    fields,
    namespace: options?.namespace,
    doc: zodObject.description,
  }
}
