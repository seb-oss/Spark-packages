import { type Database, Spanner } from '@google-cloud/spanner'
import { applyDown, applyUp } from './apply'
import { ensureMigrationTable, getAppliedMigrations } from './db'
import {
  createMigration,
  getMigration,
  getMigrationFiles,
  getNewMigrations,
  writeConfig,
} from './files'
import type { Config, DatabaseConfig, DbPath } from './types'

const getDb = ({ projectId, databaseName, instanceName }: DbPath): Database => {
  const spanner = projectId ? new Spanner({ projectId }) : new Spanner()
  return spanner.instance(instanceName).database(databaseName)
}

export const init = async (config: Config, configPath: string) => {
  await writeConfig(configPath, config)
}

export const create = async (config: DatabaseConfig, description: string) => {
  await createMigration(config.migrationsPath, description)
}

export const up = async (
  config: Config,
  database?: DatabaseConfig,
  max?: number
) => {
  // Check arguments
  if (max && !database) {
    throw new Error('Max number of migrations requires specifying a database')
  }
  const databases = database ? [database] : config.instance.databases

  for (const databaseConfig of databases) {
    const path: DbPath = {
      projectId: config.projectId,
      instanceName: config.instance.name,
      databaseName: databaseConfig.name,
    }
    const db = getDb(path)

    await ensureMigrationTable(db)

    const appliedMigrations = await getAppliedMigrations(db)
    const migrationFiles = await getMigrationFiles(
      databaseConfig.migrationsPath
    )
    const newMigrations = getNewMigrations(appliedMigrations, migrationFiles)

    console.log(`Found ${newMigrations.length} new migrations.`)
    console.log(newMigrations.map((mig) => `\t${mig}`).join('\n'))

    // Limit number of migrations if specified
    const newMigrationsToApply = max
      ? newMigrations.slice(0, max)
      : newMigrations

    for (const id of newMigrationsToApply) {
      const migration = await getMigration(databaseConfig.migrationsPath, id)
      await applyUp(db, migration)
    }
  }
}

export const down = async (config: Config, database: DatabaseConfig) => {
  const path: DbPath = {
    projectId: config.projectId,
    instanceName: config.instance.name,
    databaseName: database.name,
  }
  const db = getDb(path)

  await ensureMigrationTable(db)

  await applyDown(db)
}

export const status = async (config: Config, databases?: DatabaseConfig[]) => {
  const statuses: string[] = []
  for (const databaseConfig of databases || config.instance.databases) {
    const path: DbPath = {
      projectId: config.projectId,
      instanceName: config.instance.name,
      databaseName: databaseConfig.name,
    }
    const db = getDb(path)

    await ensureMigrationTable(db)

    const appliedMigrations = await getAppliedMigrations(db)
    const migrationFiles = await getMigrationFiles(
      databaseConfig.migrationsPath
    )
    const newMigrations = getNewMigrations(appliedMigrations, migrationFiles)

    statuses.push(
      [
        `Migrations [${databaseConfig.name}]`,
        '',
        'Applied',
        '--------------------------------------------------------------------------------',
        `${appliedMigrations.map((m) => m.id).join('\n')}\n`,
        'New',
        '--------------------------------------------------------------------------------',
        `${newMigrations.join('\n')}\n`,
      ].join('\n')
    )
  }

  return statuses.join('\n\n')
}
