import type { ExecutorContext } from '@nx/devkit'
import * as fs from 'fs'

export interface ConfigureExecutorOptions {
  package: string
}

export default async function configureExecutor(
  options: ConfigureExecutorOptions,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  let success = false
  console.info(`Executing "configure"...`)
  console.info(`Options: ${JSON.stringify(options, null, 2)}`)

  const packageJsonPath = `packages/${options.package}/package.json`

  let packageJson = {} as any
  if (!fs.existsSync(packageJsonPath)) {
    packageJson = {
      name: `@sebspark/${options.package}`,
      version: '0.0.1',
    }
  }

  packageJson = await import(packageJsonPath)

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
    console.error(error)
  }

  return { success }
}
