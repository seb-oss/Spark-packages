import type { Schema } from 'avsc'
import { expect, test } from 'vitest'
import { parse } from './parse'

test('id adds the correct header', () => {
  const schema: Schema = {
    name: 'Schema',
    type: 'record',
    fields: [],
  }
  const ts = parse(schema)

  expect(ts).toContain(`// Auto generated. Do not edit!
import { Type, type Schema } from '@sebspark/avsc-isometric'

/**
 * Extracts the record definition from a schema branch
 */
type ExtractRecord<T> = T extends { name: infer N; fields: readonly any[] }
  ? N extends string
    ? { [K in N]: { [F in T['fields'][number] as F['name']]: ResolveType<F['type']> } }
    : never
  : never

/**
 * Resolves Avro types (int, string, arrays, unions) to TypeScript
 */
type ResolveType<T> = T extends 'int' | 'long' | 'double' ? number
  : T extends 'string' ? string
  : T extends readonly ['null', infer U] ? ResolveType<U> | null
  : T extends { type: 'array'; items: infer I } ? ResolveType<I>[]
  : T extends { name: string; fields: readonly any[] } ? { [F in T['fields'][number] as F['name']]: ResolveType<F['type']> }
  : any

/**
 * The final Payload structure derived from your specific Schema
 */
export type AvroPayload<S> = S extends { fields: readonly any[] }
  ? {
      [F in S['fields'][number] as F['name']]: F['name'] extends 'data'
        ? (S['fields'][number] & { name: 'data' })['type'] extends readonly any[]
          ? ExtractRecord<(S['fields'][number] & { name: 'data' })['type'][number]> | null
          : never
        : ResolveType<F['type']>
    }
  : never`)
})
test('it parses simple schema', () => {
  const simple: Schema = {
    name: 'Simple',
    type: 'record',
    fields: [
      {
        name: 'stringField',
        type: 'string',
      },
    ],
  }
  const ts = parse(simple)

  expect(ts).toContain(`
export interface Simple {
  stringField: string
}
export const SimpleSchema = ${JSON.stringify(simple)} as const satisfies Schema
export const SimpleType = Type.forSchema(SimpleSchema)
export type SimplePayload = AvroPayload<typeof SimpleSchema>
`)
})

test('does not tamper with doc', () => {
  const simple: Schema = {
    name: 'Simple',
    type: 'record',
    doc: 'A sentence that could end here; yet continues for a bit.',
    fields: [
      {
        name: 'stringField',
        type: 'string',
      },
    ],
  }
  const ts = parse(simple)

  expect(ts).toContain(`
/**
 * A sentence that could end here; yet continues for a bit.
 */
export interface Simple {
  stringField: string
}
export const SimpleSchema = {"name":"Simple","type":"record","fields":[{"name":"stringField","type":"string"}]} as const satisfies Schema
export const SimpleType = Type.forSchema(SimpleSchema)
export type SimplePayload = AvroPayload<typeof SimpleSchema>
`)
})

test('it parses multiple schemas', () => {
  const simpleString: Schema = {
    name: 'SimpleString',
    type: 'record',
    fields: [
      {
        name: 'stringField',
        type: 'string',
      },
    ],
  }
  const simpleInt: Schema = {
    name: 'SimpleInt',
    type: 'record',
    fields: [
      {
        name: 'intField',
        type: 'int',
      },
    ],
  }
  const ts = parse(simpleString, simpleInt)

  expect(ts).toContain(`
export interface SimpleString {
  stringField: string
}
export const SimpleStringSchema = ${JSON.stringify(simpleString)} as const satisfies Schema
export const SimpleStringType = Type.forSchema(SimpleStringSchema)
export type SimpleStringPayload = AvroPayload<typeof SimpleStringSchema>

export interface SimpleInt {
  intField: number
}
export const SimpleIntSchema = ${JSON.stringify(simpleInt)} as const satisfies Schema
export const SimpleIntType = Type.forSchema(SimpleIntSchema)
export type SimpleIntPayload = AvroPayload<typeof SimpleIntSchema>
`)
})

test('it parses dependent schemas', () => {
  const independentSchema: Schema = {
    name: 'Independent',
    type: 'record',
    fields: [
      {
        name: 'stringField',
        type: 'string',
      },
    ],
  }
  const dependentSchema: Schema = {
    name: 'Dependent',
    type: 'record',
    fields: [
      {
        name: 'childField',
        type: 'Independent',
      },
    ],
  }

  expect(() => parse(dependentSchema, independentSchema)).not.toThrow()
})

test('it handles circular dependencies', () => {
  const schema1: Schema = {
    name: 'Circular1',
    type: 'record',
    fields: [
      {
        name: 'childField',
        type: 'Circular2',
      },
    ],
  }
  const schema2: Schema = {
    name: 'Circular2',
    type: 'record',
    fields: [
      {
        name: 'childField',
        type: 'Circular1',
      },
    ],
  }

  expect(() => parse(schema1, schema2)).toThrow('circular dependency')
})

test('it parses array types', () => {
  const itemSchema: Schema = {
    name: 'Item',
    type: 'record',
    fields: [
      {
        name: 'childField',
        type: 'string',
      },
    ],
  }
  const arraySchema: Schema = {
    type: 'array',
    items: 'Item',
  }

  const ts = parse(itemSchema, arraySchema)

  expect(ts).toContain(`
export interface Item {
  childField: string
}
export const ItemSchema = {"name":"Item","type":"record","fields":[{"name":"childField","type":"string"}]} as const satisfies Schema
export const ItemType = Type.forSchema(ItemSchema)
export type ItemPayload = AvroPayload<typeof ItemSchema>


export const ItemsArraySchema = {"type":"array","items":{"name":"Item","type":"record","fields":[{"name":"childField","type":"string"}]}} as const satisfies Schema
export const ItemsArrayType = Type.forSchema(ItemsArraySchema)
export type ItemsArrayPayload = AvroPayload<typeof ItemsArraySchema>
`)
})
