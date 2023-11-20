import { readFileSync, writeFileSync } from 'fs'
import { inspect } from 'util'
import { camelCase } from 'change-case'
import { parse } from 'csv-parse/sync'
import prettier from 'prettier'

const [, , inputFile, outputFile] = process.argv

const csv = readFileSync(inputFile, 'utf-8')

const mics = parse(csv, {
  columns: (headers) => headers.map((column) => camelCase(column)),
})
const map = mics.reduce(
  (map, mic) => Object.assign(map, { [mic.mic]: mic }),
  {}
)
const content = `
// This file is generated by scripts/parseMicCsv.mjs
// Do not edit manually

// biome-ignore format: Keep this as a single line
export type ISO_10383 = ${Object.keys(map)
  .slice()
  .sort((a, b) => a.localeCompare(b))
  .map((k) => `|'${k}'`)
  .join('')}

export type Mic = {${Object.entries(Object.values(map)[0]).map(([key]) => {
  return `${key}: string\n`
})}}

export type Mics = Record<ISO_10383, Mic> 

export const mics: Mics = ${inspect(map)}
`

const formattedContent = await prettier.format(content, {
  parser: 'babel-ts',
  singleQuote: true,
  trailingComma: 'es5',
  semi: false,
})

writeFileSync(outputFile, formattedContent, 'utf-8')
