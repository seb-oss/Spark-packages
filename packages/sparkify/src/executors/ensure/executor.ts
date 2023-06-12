import * as fs from 'fs'
import { EnsureExecutorSchema } from './schema'

export default async function ensureExecutor(
  options: EnsureExecutorSchema
): Promise<{ success: boolean }> {
  process.stdout.write(
    `Ensuring @${options.organisation}/${options.package} package...`
  )

  let success = false
  let packageJson = {} as any
  const currentDir = process.cwd()
  const packageJsonPath = `${currentDir}/${options.path}/${options.package}/package.json`

  console.log('MEOW', packageJsonPath, currentDir)
  if (!fs.existsSync(packageJsonPath)) {
    console.log('NOPE')
    // Initiate a new package.json
    packageJson = {
      name: `@${options.organisation}/${options.package}`,
      version: '0.0.1',
    }
  } else {
    packageJson = await import(packageJsonPath)
  }

  if (!packageJson.publishConfig) {
    packageJson.publishConfig = {
      directory: `../../dist/packages/${options.package}`,
    }
  }

  try {
    fs.writeFileSync(
      packageJsonPath,
      `${JSON.stringify(packageJson, null, 2)}\n`
    )
    success = true
  } catch (error) {
    console.log('ERROR', error)
    process.stderr.write(error.message)
  }

  return { success }
}
