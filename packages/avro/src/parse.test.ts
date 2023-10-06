import { test, expect } from 'vitest'
import { parse } from './parse'
import { Schema } from 'avsc'

test('it parses simple schema', () => {
  const simple: Schema = {
    type: 'record',
    name: 'Simple',
    fields: [
      {
        name: 'stringField',
        type: 'string'
      },
    ],
  }
  const ts = parse(simple)

  expect(ts).toEqual(`// Auto generated. Do not edit!
import { Type } from 'avsc'

export interface Simple {
  stringField: string
}

const avroSimple = Type.forSchema(${JSON.stringify(simple)})

export const Simple = {
  toBuffer: (data: Simple) => avroSimple.toBuffer(data)
  fromBuffer: (buffer: Buffer) => avroSimple.fromBuffer(buffer) as Simple
}
`)
})

test('it parses multiple schemas', () => {
  const simpleString: Schema = {
    type: 'record',
    name: 'SimpleString',
    fields: [
      {
        name: 'stringField',
        type: 'string'
      },
    ],
  }
  const simpleInt: Schema = {
    type: 'record',
    name: 'SimpleInt',
    fields: [
      {
        name: 'intField',
        type: 'int'
      },
    ],
  }
  const ts = parse(simpleString, simpleInt)

  expect(ts).toEqual(`// Auto generated. Do not edit!
import { Type } from 'avsc'

export interface SimpleString {
  stringField: string
}

const avroSimpleString = Type.forSchema(${JSON.stringify(simpleString)})

export const SimpleString = {
  toBuffer: (data: SimpleString) => avroSimpleString.toBuffer(data)
  fromBuffer: (buffer: Buffer) => avroSimpleString.fromBuffer(buffer) as SimpleString
}

export interface SimpleInt {
  intField: number
}

const avroSimpleInt = Type.forSchema(${JSON.stringify(simpleInt)})

export const SimpleInt = {
  toBuffer: (data: SimpleInt) => avroSimpleInt.toBuffer(data)
  fromBuffer: (buffer: Buffer) => avroSimpleInt.fromBuffer(buffer) as SimpleInt
}
`)
})
