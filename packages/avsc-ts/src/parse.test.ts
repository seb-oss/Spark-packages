import type { Schema } from 'avsc'
import { expect, test } from 'vitest'
import { parse } from './parse'

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

  expect(ts).toEqual(`// Auto generated. Do not edit!
import { Type } from '@sebspark/avsc-isometric'

export interface Simple {
  stringField: string
}

const avroSimple = Type.forSchema(${JSON.stringify(simple)})

export const SimpleConverter = {
  toBuffer: (data: Simple) => avroSimple.toBuffer(data),
  fromBuffer: (buffer: Buffer) => avroSimple.fromBuffer(buffer) as Simple
}
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

  expect(ts).toEqual(`// Auto generated. Do not edit!
import { Type } from '@sebspark/avsc-isometric'

/**
 * A sentence that could end here; yet continues for a bit.
 */
export interface Simple {
  stringField: string
}

const avroSimple = Type.forSchema({"name":"Simple","type":"record","fields":[{"name":"stringField","type":"string"}]})

export const SimpleConverter = {
  toBuffer: (data: Simple) => avroSimple.toBuffer(data),
  fromBuffer: (buffer: Buffer) => avroSimple.fromBuffer(buffer) as Simple
}
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

  expect(ts).toEqual(`// Auto generated. Do not edit!
import { Type } from '@sebspark/avsc-isometric'

export interface SimpleString {
  stringField: string
}

const avroSimpleString = Type.forSchema(${JSON.stringify(simpleString)})

export const SimpleStringConverter = {
  toBuffer: (data: SimpleString) => avroSimpleString.toBuffer(data),
  fromBuffer: (buffer: Buffer) => avroSimpleString.fromBuffer(buffer) as SimpleString
}

export interface SimpleInt {
  intField: number
}

const avroSimpleInt = Type.forSchema(${JSON.stringify(simpleInt)})

export const SimpleIntConverter = {
  toBuffer: (data: SimpleInt) => avroSimpleInt.toBuffer(data),
  fromBuffer: (buffer: Buffer) => avroSimpleInt.fromBuffer(buffer) as SimpleInt
}
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

  expect(ts).toEqual(`// Auto generated. Do not edit!
import { Type } from '@sebspark/avsc-isometric'

export interface Item {
  childField: string
}

const avroItem = Type.forSchema({"name":"Item","type":"record","fields":[{"name":"childField","type":"string"}]})

export const ItemConverter = {
  toBuffer: (data: Item) => avroItem.toBuffer(data),
  fromBuffer: (buffer: Buffer) => avroItem.fromBuffer(buffer) as Item
}



const avroItemsArray = Type.forSchema({"type":"array","items":{"name":"Item","type":"record","fields":[{"name":"childField","type":"string"}]}})

export const ItemsArrayConverter = {
  toBuffer: (data: Item[]) => avroItemsArray.toBuffer(data),
  fromBuffer: (buffer: Buffer) => avroItemsArray.fromBuffer(buffer) as Item[]
}
`)
})
