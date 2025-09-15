#!/usr/bin/env node
import { cac } from 'cac'
import { convertBrunoFileOrCollection } from './main'

const pkg = require('../package.json')

const cli = cac('bruno-to-k6')

cli
  .command('<input>', 'Convert a .bru file or collection directory')
  .option('-o, --output <path>', 'Output file path (default: stdout)')
  .option(
    '-e, --env <name>',
    'Environment name defined in the bruno `environments/` folder'
  )
  .option('--k6-options <path>', 'Path to a JSON file with k6 options')
  .option('-s, --separate', 'Generate a separate file per request')
  .action(async (input: string, flags: any) => {
    try {
      const { main } = await convertBrunoFileOrCollection(input, {
        environment: flags.env,
        separate: Boolean(flags.separate),
        k6Options: flags.k6Options,
        output: flags.output,
      })

      if (!flags.output) {
        process.stdout.write(main)
      }
    } catch (err: any) {
      console.error('Conversion failed:', err.message || err)
      process.exit(1)
    }
  })

cli.help()
cli.version(pkg.version)
cli.parse()
