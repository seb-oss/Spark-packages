// Auto generated. Do not edit!
import { Type } from 'avsc'

export type Colors = 'RED' | 'GREEN' | 'BLUE'

export interface TestRecord {
  field1: string
  field2: number
}

export interface AllTypes {
  nullField: null
  booleanField: boolean
  intField: number
  longField: number
  floatField: number
  doubleField: number
  stringField: string
  bytesField: Buffer
  arrayField: number[]
  mapField: {
    [index: string]: string
  }
  enumField: Colors
  recordField: TestRecord
  fixedField: string
  unionField: null | string | TestRecord
  decimalField: Buffer
  dateField: number
  timeMillisField: number
  timeMicrosField: number
  timestampMillisField: number
  timestampMicrosField: number
  durationField: Fixed
}

const avroAllTypes = Type.forSchema({"type":"record","name":"AllTypes","fields":[{"name":"nullField","type":"null"},{"name":"booleanField","type":"boolean"},{"name":"intField","type":"int"},{"name":"longField","type":"long"},{"name":"floatField","type":"float"},{"name":"doubleField","type":"double"},{"name":"stringField","type":"string"},{"name":"bytesField","type":"bytes"},{"name":"arrayField","type":{"type":"array","items":"int"}},{"name":"mapField","type":{"type":"map","values":"string"}},{"name":"enumField","type":{"type":"enum","name":"Colors","symbols":["RED","GREEN","BLUE"]}},{"name":"recordField","type":{"type":"record","name":"TestRecord","fields":[{"name":"field1","type":"string"},{"name":"field2","type":"int"}]}},{"name":"fixedField","type":{"type":"fixed","name":"FourBytes","size":4}},{"name":"unionField","type":["null","string","TestRecord"]},{"name":"decimalField","type":{"type":"bytes","logicalType":"decimal","precision":5,"scale":2}},{"name":"dateField","type":{"type":"int","logicalType":"date"}},{"name":"timeMillisField","type":{"type":"int","logicalType":"time-millis"}},{"name":"timeMicrosField","type":{"type":"long","logicalType":"time-micros"}},{"name":"timestampMillisField","type":{"type":"long","logicalType":"timestamp-millis"}},{"name":"timestampMicrosField","type":{"type":"long","logicalType":"timestamp-micros"}},{"name":"durationField","type":{"type":"fixed","name":"DurationType","size":12,"logicalType":"duration"}}]})

export const AllTypes = {
  toBuffer: (data: AllTypes) => avroAllTypes.toBuffer(data),
  fromBuffer: (buffer: Buffer) => avroAllTypes.fromBuffer(buffer) as AllTypes
}

export interface AnotherRecord {
  nullField: null
  booleanField: boolean
  intField: number
  longField: number
  floatField: number
  doubleField: number
  stringField: string
}

const avroAnotherRecord = Type.forSchema({"type":"record","name":"AnotherRecord","fields":[{"name":"nullField","type":"null"},{"name":"booleanField","type":"boolean"},{"name":"intField","type":"int"},{"name":"longField","type":"long"},{"name":"floatField","type":"float"},{"name":"doubleField","type":"double"},{"name":"stringField","type":"string"}]})

export const AnotherRecord = {
  toBuffer: (data: AnotherRecord) => avroAnotherRecord.toBuffer(data),
  fromBuffer: (buffer: Buffer) => avroAnotherRecord.fromBuffer(buffer) as AnotherRecord
}
