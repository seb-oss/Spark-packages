import * as fs from 'node:fs'
import path from 'node:path'
import { type RecordType, avroToTypeScript } from 'avro-typescript'

const schemaPath = path.resolve(process.cwd(), 'schemas/stockticker.avsc')
const outputPath = path.resolve(process.cwd(), 'src/generated/stockticker.ts')

const schemaText = fs.readFileSync(schemaPath, 'utf-8')
const schema = JSON.parse(schemaText) as RecordType
const types = avroToTypeScript(schema as RecordType)
const cloudSchema = `\n export const CloudSchema  = { \n
        schemaId: 'stockticker-v1', \n
        avroDefinition: \`${schemaText}\` \n
    }`
fs.writeFileSync(outputPath, types + cloudSchema)
