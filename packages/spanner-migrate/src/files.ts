import { access, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { Config, Migration } from './types'

export const getMigrationFiles = async (path: string): Promise<string[]> => {
  try {
    // Read the directory contents
    const files = await readdir(path)

    // Filter and map files to extract the `id` (file name without extension)
    const migrationFileIds = files
      .filter((file) => file.endsWith('.sql')) // Only include .sql files
      .map((file) => file.replace(/\.sql$/, '')) // Remove file extension to use as `id`

    return migrationFileIds
  } catch (error) {
    throw new Error(
      `Failed to get migration files: ${(error as Error).message}`
    )
  }
}

export const getMigration = async (
  path: string,
  id: string
): Promise<Migration> => {
  try {
    // Construct the full file path
    const filePath = resolve(process.cwd(), join(path, `${id}.sql`))

    // Check if the file exists
    try {
      await access(filePath)
    } catch {
      throw new Error(`Migration file not found: ${filePath}`)
    }

    // Dynamically import the migration file
    const migrationText = await readFile(filePath, 'utf8')

    const up = getSql(migrationText, 'up')
    const down = getSql(migrationText, 'down')
    const description = getDescription(migrationText)

    // Validate that the required exports (`up` and `down`) exist
    if (!up || !down) {
      throw new Error(
        `Migration file ${filePath} does not export required scripts (up, down).`
      )
    }

    // Return the migration as a `Migration` object
    return { id, description, up, down }
  } catch (error) {
    throw new Error(
      `Failed to get migration ${id}: ${(error as Error).message}`
    )
  }
}

const getDescription = (text: string | undefined) =>
  text?.match(/^--\s*Description:\s*(.+)$/m)?.[1]?.trim() || ''

const getSql = (text: string | undefined, direction: 'up' | 'down') => {
  const rx = {
    up: /---- UP ----\n([\s\S]*?)\n---- DOWN ----/,
    down: /---- DOWN ----\n([\s\S]*)$/,
  }
  return text?.match(rx[direction])?.[1]?.replace(/--.*$/gm, '').trim()
}

export const getNewMigrations = (
  applied: Migration[],
  files: string[]
): string[] => {
  // Ensure files are sorted to match applied sequence
  const sortedFiles = files.sort()

  // Check for interlacing or missing migrations
  for (let ix = 0; ix < applied.length; ix++) {
    if (sortedFiles[ix] !== applied[ix].id) {
      throw new Error(
        `Mismatch between applied migrations and files. Found '${sortedFiles[ix]}' but expected '${applied[ix].id}' at position ${ix}.`
      )
    }
  }

  // Return new migrations (files not already applied)
  const newMigrations = sortedFiles.slice(applied.length)

  return newMigrations
}

export const createMigration = async (
  path: string,
  description: string
): Promise<void> => {
  // Generate timestamp and parse description to create the migration ID/filename
  const timestamp = new Date().toISOString()
  const compactTimestamp = timestamp.replace(/[-:.TZ]/g, '')
  const parsedDescription = description.replace(/\s+/g, '_').toLowerCase()
  const filename = `${compactTimestamp}_${parsedDescription}.sql`

  // Full file path
  const filePath = join(path, filename)

  // Template migration content
  const template = `-- Created: ${timestamp}
-- Description: ${description}

---- UP ----



---- DOWN ----


`

  try {
    // Ensure the directory exists
    await mkdir(path, { recursive: true })

    // Write the migration file
    await writeFile(filePath, template.trim(), 'utf8')

    console.log(`Migration created: ${filePath}`)
  } catch (error) {
    throw new Error(`Error creating migration: ${(error as Error).message}`)
  }
}

export const writeConfig = async (
  path: string,
  config: Config
): Promise<void> => {
  try {
    // Serialize the config object into a pretty JSON format
    const configContent = JSON.stringify(config, null, 2)

    // Write the config to the specified path
    await writeFile(path, configContent, 'utf8')

    console.log(`Configuration written to ${path}`)
  } catch (error) {
    throw new Error(
      `Error writing configuration to ${path}: ${(error as Error).message}`
    )
  }
}
