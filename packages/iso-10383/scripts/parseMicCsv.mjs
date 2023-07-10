import { readFileSync, writeFileSync } from 'fs'
import { inspect } from 'util'
import { parse } from 'csv-parse/sync'
import { camelCase } from 'change-case'

const [, , inputFile, outputFile] = process.argv

let csv = readFileSync(inputFile, 'utf-8')

const mics = parse(csv, {
  columns: (headers) => headers.map((column) => camelCase(column)),
})
const map = mics.reduce(
  (map, mic) => Object.assign(map, { [mic.mic]: mic }),
  {}
)
const content = `export const mics = ${inspect(map)}

export type Mics = typeof mics
export type ISO_10383 = keyof Mics
`

writeFileSync(outputFile, content, 'utf-8')
