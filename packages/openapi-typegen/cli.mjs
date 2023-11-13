#!/usr/bin/env node

import { generate } from '@sebspark/openapi-typegen'
import yargs from 'yargs'
import chalk from 'chalk'
import boxen from 'boxen'

const usage = chalk.magenta(
  '\nUsage: @sebspark/typegen --input ./schemas --output ./dist \n' +
    boxen(
      chalk.green('\n' + 'Generates Typescript from OpenAPI schemas' + '\n'),
      {
        padding: 1,
        borderColor: 'green',
        dimBorder: true,
      },
    ) +
    '\n',
)

const argv = yargs(process.argv.slice(2))
  .usage(usage)
  .options({
    input: { alias: 'i', type: 'string', demandOption: true },
    output: { alias: 'o', type: 'string', demandOption: false },
  })
  .help()
  .parseSync()

generate({ input: argv.input, output: argv.output })
