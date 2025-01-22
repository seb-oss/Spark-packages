#!/usr/bin/env node
import fs from 'node:fs/promises'
import { join } from 'node:path'
import input from '@inquirer/input'
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
  .usage('$0 <command>')
  .command(
    'init',
    'Initialize a .spanner-migrate.config.json file',
    async () => {
      const migrationsPath = await input({
        message: 'Enter the path for your migrations',
        required: true,
        default: './migrations',
      })
      const instanceName = await input({
        message: 'Enter Spanner instance name',
        required: true,
      })
      const databaseName = await input({
        message: 'Enter Spanner database name',
        required: true,
      })
      const projectId = await input({
        message: 'Enter Google Cloud project name',
        required: false,
      })

      const config: Config = { instanceName, databaseName, migrationsPath }
      if (projectId) config.projectId = projectId

      await init(config, CONFIG_FILE)

      console.log(`Configuration written to ${CONFIG_FILE}`)
    }
  )
  .command<{ description: string[] }>(
    'create <description ...>',
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
      const fullDescription = args.description.join(' ')
      await create(config, fullDescription)
      console.log(
        `Migration file created: '${join(config.migrationsPath, args.description.join('_'))}.sql'`
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
  .demandCommand()
  .help()
  .parse()
