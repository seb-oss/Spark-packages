#!/usr/bin/env node
import fs from 'node:fs/promises'
import { join } from 'node:path'
import { input, select } from '@inquirer/prompts'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { create, down, init, status, up } from './index.js'
import type { Config, DatabaseConfig } from './types.js'

const CONFIG_FILE = './.spanner-migrate.config.json'

yargs(hideBin(process.argv))
  .scriptName('spanner-migrate')
  .usage('$0 <command>')

  /**
   * Handles the `init` command, which initializes a `.spanner-migrate.config.json` file.
   *
   * - Prompts the user to enter a Spanner instance name.
   * - Collects database configurations interactively.
   * - Allows an optional Google Cloud project name.
   * - Writes the generated configuration to the `CONFIG_FILE`.
   *
   * @throws {Error} If required input (e.g., instance name) is not provided.
   */
  .command(
    'init',
    'Initialize a .spanner-migrate.config.json file',
    async () => {
      // Ask for instance name
      const instanceName = await input({
        message: 'Enter Spanner instance name',
        required: true,
      })

      // Ask for database name
      const databases: DatabaseConfig[] = [
        (await getDatabaseConfig(true)) as DatabaseConfig,
      ]

      // Loop to allow adding multiple databases
      while (true) {
        const dbConfig = await getDatabaseConfig(false)
        if (!dbConfig) break
        databases.push(dbConfig)
      }

      // Ask for project name
      const projectId = await input({
        message: 'Enter Google Cloud project name',
        required: false,
      })

      // Construct the final configuration
      const config: Config = {
        instance: {
          name: instanceName,
          databases,
        },
      }
      if (projectId) config.projectId = projectId

      await init(config, CONFIG_FILE)
    }
  )

  /**
   * Handles the `create` command, which generates a new migration file.
   *
   * - If `--database` (`-d`) is provided, it uses the specified database.
   * - If multiple databases exist and none is specified, it prompts the user to select one.
   * - The migration filename is constructed by joining `description` words with `_`.
   *
   * @param {string} [database] - (Optional) The name of the database to use. Must match an existing database.
   * @param {string[]} description - The words describing the migration. These will be joined with `_` in the filename.
   *
   * @throws {Error} If the specified database does not exist or if no valid database is found.
   */
  .command<{ database?: string; description: string[] }>(
    'create <description ...>',
    'Create a new migration file',
    (yargs) => {
      yargs
        .option('database', {
          alias: 'd',
          type: 'string',
          describe: 'Database name',
        })
        .positional('description', {
          type: 'string',
          describe: 'Description of the migration',
          demandOption: true,
        })
    },
    async (args) => {
      const config = await loadConfig()
      const fullDescription = args.description.join(' ')

      let databaseConfig: DatabaseConfig | undefined

      if (args.database) {
        // Look for the specified database in the config
        databaseConfig = config.instance.databases.find(
          (db) => db.name === args.database
        )
        if (!databaseConfig) {
          throw new Error(`Unknown database name "${args.database}"`)
        }
      } else {
        // Auto-select if there's only one database, otherwise prompt user
        if (config.instance.databases.length === 1) {
          databaseConfig = config.instance.databases[0]
        } else {
          databaseConfig = await select<DatabaseConfig>({
            message: 'Select database',
            choices: config.instance.databases.map((dbConfig) => ({
              name: dbConfig.name,
              value: dbConfig,
            })),
          })
        }
      }

      if (!databaseConfig) throw new Error('No database config found')

      await create(databaseConfig, fullDescription)
      console.log(
        `Migration file created: '${join(databaseConfig.migrationsPath, args.description.join('_'))}.sql'`
      )
    }
  )

  /**
   * Applies pending migrations to one or more databases.
   *
   * - If no `--database` and no `--max` are provided, applies all migrations to all databases.
   * - If `--max` is specified, `--database` is required.
   * - If `--max` is provided, it must be an integer greater than 0.
   * - If a non-existing database is specified, the command throws an error.
   * - If a valid database is specified without `--max`, applies all migrations for that database.
   * - Calls `up` with either all databases (`up(config)`) or a specific one (`up(config, database, max?)`).
   *
   * @throws {Error} If `--max` is used without `--database`, or if `--max` is invalid.
   * @throws {Error} If the specified database does not exist.
   */
  .command<{ database?: string; max?: number }>(
    'up',
    'Apply migrations',
    (yargs) => {
      yargs
        .option('database', {
          alias: 'd',
          type: 'string',
          describe: 'Database name',
          requiresArg: false,
        })
        .option('max', {
          alias: 'm',
          type: 'number',
          describe:
            'Maximum number of migrations to apply (requires --database)',
          requiresArg: false,
        })
    },
    async (args) => {
      const config = await loadConfig()

      if (args.max !== undefined) {
        if (!args.database) {
          throw new Error('The --max option requires a specified --database')
        }
        if (!Number.isInteger(args.max) || args.max <= 0) {
          throw new Error('The --max option must be an integer greater than 0')
        }
      }

      if (args.database) {
        // Validate database
        const databaseConfig = config.instance.databases.find(
          (db) => db.name === args.database
        )
        if (!databaseConfig) {
          throw new Error(`Unknown database name "${args.database}"`)
        }

        // Call `up(config, database, max?)`
        if (args.max !== undefined) {
          await up(config, databaseConfig, args.max)
        } else {
          await up(config, databaseConfig)
        }
      } else {
        // No database specified, apply to all
        await up(config)
      }

      console.log('Migrations applied successfully.')
    }
  )

  /**
   * Handles the `down` command, which rolls back the last applied migration.
   *
   * - If a single database exists, it is automatically selected.
   * - If multiple databases exist, `--database` is **required**.
   * - If `--database` is specified, it must match an existing database.
   *
   * @throws {Error} If multiple databases exist and `--database` is not provided.
   * @throws {Error} If the specified `database` does not exist in the configuration.
   */
  .command<{ database?: string }>(
    'down',
    'Roll back the last applied migration',
    (yargs) => {
      yargs.option('database', {
        alias: 'd',
        type: 'string',
        describe:
          'Specify the database to roll back (required if multiple databases exist)',
      })
    },
    async (args) => {
      const config = await loadConfig()

      let databaseConfig: DatabaseConfig | undefined
      if (args.database) {
        databaseConfig = config.instance.databases.find(
          (dbConfig) => dbConfig.name === args.database
        )
        if (!databaseConfig) {
          throw new Error(`Unknown database name "${args.database}"`)
        }
      } else if (config.instance.databases.length === 1) {
        databaseConfig = config.instance.databases[0]
      } else {
        throw new Error(
          'Multiple databases detected. Use --database to specify which one to roll back.'
        )
      }

      if (!databaseConfig) throw new Error('No database config found')

      await down(config, databaseConfig)
      console.log('Last migration rolled back successfully.')
    }
  )

  /**
   * Handles the `status` command, which displays the migration status.
   *
   * - If `--database` is specified, it must match an existing database.
   * - If no `--database` is provided, `status` runs for all databases in the config.
   *
   * @throws {Error} If the specified `database` does not exist in the configuration.
   */
  .command<{ database?: string }>(
    'status',
    'Show the migration status',
    (yargs) => {
      yargs.option('database', {
        alias: 'd',
        type: 'string',
        describe:
          'Specify a database to check status (optional, runs on all databases if omitted)',
      })
    },
    async (args) => {
      const config = await loadConfig()

      let migrationStatus: string

      if (args.database) {
        const databaseConfig = config.instance.databases.find(
          (db) => db.name === args.database
        )
        if (!databaseConfig) {
          throw new Error(`Unknown database name "${args.database}"`)
        }
        migrationStatus = await status(config, [databaseConfig])
      } else {
        migrationStatus = await status(config)
      }

      console.log(migrationStatus)
    }
  )

  .demandCommand()
  .help()
  .parse()

//#region Helper functions

/**
 * Loads the migration configuration from the config file.
 *
 * @returns {Promise<Config>} The parsed configuration object.
 * @throws {Error} If the config file is missing or invalid.
 */
async function loadConfig(): Promise<Config> {
  try {
    const configContent = await fs.readFile(CONFIG_FILE, 'utf8')
    return JSON.parse(configContent)
  } catch {
    console.error('Config file not found. Run "spanner-migrate init" first.')
    process.exit(1)
  }
}

/**
 * Prompts the user for database configuration details.
 *
 * @param {boolean} required - Whether the database entry is required.
 * @returns {Promise<DatabaseConfig | undefined>} The database configuration or undefined if skipped.
 */
const getDatabaseConfig = async (required: boolean) => {
  const message = required
    ? 'Enter Spanner database name'
    : 'Enter another Spanner database name [Enter to continue]'
  const name = await input({
    message,
    required,
  })
  if (!name) return

  const migrationsPath = await input({
    message: 'Enter the path for your migrations',
    required: true,
    default: `./migrations/${name}`,
  })
  return {
    name,
    migrationsPath,
  } as DatabaseConfig
}

//#endregion
