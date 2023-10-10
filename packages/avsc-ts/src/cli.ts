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

const usage = chalk.magenta('\nUsage: avsc-ts -i ./schemas -o ./dist \n'
  + boxen(chalk.green('\n' + 'Translates a sentence to specific language' + '\n'), {padding: 1, borderColor: 'green', dimBorder: true}) + '\n')

yargs.usage(usage)
