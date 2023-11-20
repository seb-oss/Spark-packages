#!/usr/bin/env node

import { readSchemas, saveTypescript } from './files'
import { parse } from './parse'
import yargs from 'yargs'
import chalk from 'chalk'
import boxen from 'boxen'

export type Opts = {
  inputpath: string
  outputpath?: string
  schemaname?: string
}
export const parseSchemas = ({ inputpath, outputpath, schemaname }: Opts) => {
  const schemas = readSchemas(inputpath)
  const ts = parse(...schemas)
  saveTypescript(ts, outputpath || inputpath, schemaname)
}

const usage = chalk.magenta(
  '\nUsage: avsc-ts --input ./schemas --output ./dist \n' +
    boxen(chalk.green('\n' + 'Generates Typescript from avro files' + '\n'), {
      padding: 1,
      borderColor: 'green',
      dimBorder: true,
    }) +
    '\n'
)

const argv = yargs(process.argv.slice(2))
  .usage(usage)
  .options({
    input: { alias: 'i', type: 'string', demandOption: true },
    output: { alias: 'o', type: 'string', demandOption: true },
  })
  .help()
  .parseSync()

const inputpath = argv.input
const outputpath = argv.output

parseSchemas({
  inputpath,
  outputpath,
})
