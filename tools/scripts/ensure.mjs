import * as fs from 'fs'

const configuration = {
  organisation: 'sebspark',
  package: process.argv[2],
  path: 'packages',
}

export default async function ensure(options) {
  console.log(`Ensuring @${options.organisation}/${options.package} package...`)

  let packageJson = {}
  const currentDir = process.cwd()
  const packageJsonPath = `${currentDir}/${options.path}/${options.package}/package.json`

  if (!fs.existsSync(packageJsonPath)) {
    // Initiate a new package.json
    packageJson = {
      name: `@${options.organisation}/${options.package}`,
      version: '0.0.1',
    }
  } else {
    packageJson = JSON.parse(await fs.readFileSync(packageJsonPath))
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

    console.log('Done!', JSON.stringify(packageJson, null, 2))
  } catch (error) {
    console.error('ERROR', error)
  }
}

ensure(configuration)
