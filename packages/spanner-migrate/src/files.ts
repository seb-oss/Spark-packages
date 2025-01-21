import { access, mkdir, readdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { Config, Migration } from './types'

export const getMigrationFiles = async (path: string): Promise<string[]> => {
  try {
    // Read the directory contents
    const files = await readdir(path)

    // Filter and map files to extract the `id` (file name without extension)
    const migrationFileIds = files
      .filter((file) => file.endsWith('.ts')) // Only include .ts files
      .map((file) => file.replace(/\.ts$/, '')) // Remove file extension to use as `id`

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
    const filePath = resolve(process.cwd(), join(path, `${id}.ts`))

    // Check if the file exists
    try {
      await access(filePath)
    } catch (err) {
      throw new Error(`Migration file not found: ${filePath}`)
    }

    // Dynamically import the migration file
    const migrationModule = await import(filePath)

    // Validate that the required exports (`up` and `down`) exist
    if (!migrationModule.up || !migrationModule.down) {
      throw new Error(
        `Migration file ${filePath} does not export required scripts (up, down).`
      )
    }

    // Return the migration as a `Migration` object
    return {
      id,
      description: id
        .split('_')
        .slice(1)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '), // Generate a human-readable description
      up: migrationModule.up,
      down: migrationModule.down,
    }
  } catch (error) {
    throw new Error(
      `Failed to get migration ${id}: ${(error as Error).message}`
    )
  }
}

export const getNewMigrations = (
  applied: Migration[],
  files: string[]
): string[] => {
  // Ensure files are sorted to match applied sequence
  const sortedFiles = files.sort()

  // Check for interlacing or missing migrations
  for (let ix = 0; ix < applied.length; ix++) {
    console.log(sortedFiles[ix], applied[ix].id)
    if (sortedFiles[ix] !== applied[ix].id) {
      throw new Error(
        `Mismatch between applied migrations and files. Found '${sortedFiles[ix]}' but expected '${applied[ix].id}' at position ${ix}.`
      )
    }
  }

  // Return new migrations (files not already applied)
  const newMigrations = sortedFiles.slice(applied.length)
  console.log(`Found ${newMigrations.length} new migrations.`)

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
  const filename = `${compactTimestamp}_${parsedDescription}.ts`

  // Full file path
  const filePath = join(path, filename)

  // Template migration content
  const template = `// ${timestamp}
// ${description}

export const up = \`
  -- SQL for migrate up
\`

export const down = \`
  -- SQL for migrate down
\`
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
