#!/usr/bin/env node
import fs from 'node:fs/promises'
import { join } from 'node:path'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { create, down, init, status, up } from './index'
import type { Config } from './types'

const CONFIG_FILE = './.spanner-migrate.config.json'

async function loadConfig(): Promise<Config> {
  try {
    const configContent = await fs.readFile(CONFIG_FILE, 'utf8')
    return JSON.parse(configContent)
  } catch {
    console.error('Config file not found. Run "spanner-migrate init" first.')
    process.exit(1)
  }
}

yargs(hideBin(process.argv))
  .scriptName('spanner-migrate')
  .usage('$0 <command> [options]')
  .command<Config>(
    'init',
    'Initialize a .spanner-migrate.config.json file',
    (yargs) => {
      yargs.option('migrationsPath', {
        type: 'string',
        describe: 'Path to the migrations folder',
        default: './spanner-migrations',
      })
      yargs.option('instanceName', {
        type: 'string',
        describe: 'Spanner instance name',
        demandOption: true,
      })
      yargs.option('databaseName', {
        type: 'string',
        describe: 'Spanner database name',
        demandOption: true,
      })
      yargs.option('projectName', {
        type: 'string',
        describe: 'Google Cloud project name (optional)',
      })
    },
    async (args) => {
      // Call the `init` method from index.ts
      await init(args, CONFIG_FILE)

      console.log(`Configuration written to ${CONFIG_FILE}`)
    }
  )
  .command<{ description: string }>(
    'create <description>',
    'Create a new migration file',
    (yargs) => {
      yargs.positional('description', {
        type: 'string',
        describe: 'Description of the migration',
        demandOption: true,
      })
    },
    async (args) => {
      const config = await loadConfig()
      await create(config, args.description)
      console.log(
        `Migration file created: '${join(config.migrationsPath, args.description)}'`
      )
    }
  )
  .command<{ max: number }>(
    'up',
    'Apply migrations',
    (yargs) => {
      yargs.option('max', {
        alias: 'm',
        type: 'number',
        describe: 'Maximum number of migrations to apply',
        default: 1000,
      })
    },
    async (args) => {
      const config = await loadConfig()
      await up(config, args.max)
      console.log('Migrations applied successfully.')
    }
  )
  .command('down', 'Roll back the last applied migration', {}, async () => {
    const config = await loadConfig()
    await down(config)
    console.log('Last migration rolled back successfully.')
  })
  .command('status', 'Show the migration status', {}, async () => {
    const config = await loadConfig()
    const migrationStatus = await status(config)
    console.log(migrationStatus)
  })
  .help()
  .strict()
  .parse()
