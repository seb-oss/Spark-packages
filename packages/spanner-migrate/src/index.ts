import { type Database, Spanner } from '@google-cloud/spanner'
import { getAppliedMigrations } from './db'
import {
  createMigration,
  getMigration,
  getMigrationFiles,
  getNewMigrations,
  writeConfig,
} from './files'
import { applyDown, applyUp } from './apply'
import type { Config } from './types'

const getDb = ({ projectId, databaseName, instanceName }: Config): Database => {
  const spanner = projectId ? new Spanner({ projectId }) : new Spanner()
  return spanner.instance(instanceName).database(databaseName)
}

export const init = async (config: Config, configPath: string) => {
  await writeConfig(configPath, config)
}

export const create = async (config: Config, description: string) => {
  await createMigration(config.migrationsPath, description)
}

export const up = async (config: Config, max = 1000) => {
  const db = getDb(config)
  const appliedMigrations = await getAppliedMigrations(db)
  const migrationFiles = await getMigrationFiles(config.migrationsPath)
  const newMigrations = getNewMigrations(appliedMigrations, migrationFiles)

  console.log(`Found ${newMigrations.length} new migrations.`)

  for (const id of migrationFiles.slice(0, max)) {
    const migration = await getMigration(config.migrationsPath, id)
    await applyUp(db, migration)
  }
}

export const down = async (config: Config) => {
  await applyDown(getDb(config))
}

export const status = async (config: Config) => {
  const db = getDb(config)
  const appliedMigrations = await getAppliedMigrations(db)
  const migrationFiles = await getMigrationFiles(config.migrationsPath)
  const newMigrations = getNewMigrations(appliedMigrations, migrationFiles)

  return `Migrations
  
  Applied
  --------------------------------------------------------------------------------
  ${appliedMigrations.map((m) => m.id).join('\n')}
  
  New
  --------------------------------------------------------------------------------
  ${newMigrations.join('\n')}
  `
}
