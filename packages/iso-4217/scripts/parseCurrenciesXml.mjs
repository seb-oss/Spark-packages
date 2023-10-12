import { readFileSync, writeFileSync } from 'fs'
import { inspect } from 'util'
import { XMLParser } from 'fast-xml-parser'
import prettier from 'prettier'

const [, , inputFile, outputFile] = process.argv

const xml = readFileSync(inputFile, 'utf-8')
const currencies = new XMLParser().parse(xml).ISO_4217.CcyTbl.CcyNtry
const map = currencies
  .filter((c) => c.Ccy)
  .reduce(
    (map, c) =>
      Object.assign(map, {
        [c.Ccy]: {
          currencyName: c.CcyNm,
          currencyCode: c.Ccy,
          currencyNumber: c.CcyNbr,
          currencyMinorUnits: c.CcyMnrUnts,
        },
      }),
    {},
  )

const content = `export const currencies = ${inspect(map)}

export type Currencies = typeof currencies
export type ISO_4217 = keyof Currencies
`

const formattedContent = await prettier.format(content, {
  parser: 'babel-ts',
  singleQuote: true,
  trailingComma: 'es5',
  semi: false,
})

writeFileSync(outputFile, formattedContent, 'utf-8')
