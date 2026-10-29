#!/usr/bin/env node

import yargs from 'yargs'
import { readSchemas, saveTypescript } from './files'
import { parse } from './parse'
import { usage } from './usage'

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
