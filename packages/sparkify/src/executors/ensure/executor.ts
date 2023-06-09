import type { ExecutorContext } from '@nx/devkit'
import * as fs from 'fs'

export interface EnsureExecutorOptions {
  package: string
}

export default async function ensureExecutor(
  options: EnsureExecutorOptions,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  let success = false
  console.info(`Executing "ensure"...`)
  console.info(`Options: ${JSON.stringify(options, null, 2)}`)

  const packageJsonPath = `packages/${options.package}/package.json`

  let packageJson = {} as any
  if (!fs.existsSync(packageJsonPath)) {
    packageJson = {
      name: `@sebspark/${options.package}`,
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
    console.error(error)
  }

  return { success }
}
