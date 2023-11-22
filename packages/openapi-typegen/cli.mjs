#!/usr/bin/env node

import { generate } from '@sebspark/openapi-typegen'
import boxen from 'boxen'
import chalk from 'chalk'
import yargs from 'yargs'

const usage = chalk.magenta(` 
Usage: @sebspark/typegen --input ./schemas --output ./dist

${boxen(
  chalk.green('\n' + 'Generates Typescript from OpenAPI schemas' + '\n'),
  {
    padding: 1,
    borderColor: 'green',
    dimBorder: true,
  }
)}
`)

const argv = yargs(process.argv.slice(2))
  .usage(usage)
  .options({
    input: { alias: 'i', type: 'string', demandOption: true },
    output: { alias: 'o', type: 'string', demandOption: false },
  })
  .help()
  .parseSync()

generate({ input: argv.input, output: argv.output })
