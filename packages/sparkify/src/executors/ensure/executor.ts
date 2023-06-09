import * as fs from 'fs'

export interface EnsureExecutorOptions {
  organisation: string
  package: string
}

export default async function ensureExecutor(
  options: EnsureExecutorOptions
): Promise<{ success: boolean }> {
  process.stdout.write(
    `Ensuring @${options.organisation}/${options.package} package...`
  )

  let success = false
  let packageJson = {} as any
  const packageJsonPath = `packages/${options.package}/package.json`

  if (!fs.existsSync(packageJsonPath)) {
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
    process.stderr.write(error)
  }

  return { success }
}
