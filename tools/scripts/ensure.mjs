import * as fs from 'fs'

const configuration = {
  organisation: 'sebspark',
  package: process.argv[2],
  path: 'packages',
}

console.log(
  `Ensuring @${configuration.organisation}/${configuration.package} package...`
)

let packageJson = {}
const currentDir = process.cwd()
const packageName = `@${configuration.organisation}/${configuration.package}`
const packagePath = `${currentDir}/${configuration.path}/${configuration.package}`
const packageJsonPath = `${packagePath}/package.json`

if (!fs.existsSync(packagePath)) {
  console.error(`ERROR: ${packageName} package does not exist.`)
  process.exit(0)
}

if (!fs.existsSync(packageJsonPath)) {
  // Initiate a new package.json
  packageJson = {
    name: `@${configuration.organisation}/${configuration.package}`,
    version: '0.0.1',
  }
} else {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath))
}

if (!packageJson.publishConfig) {
  packageJson.publishConfig = {
    directory: `../../dist/packages/${configuration.package}`,
  }
}

try {
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`)

  console.log('Done!', JSON.stringify(packageJson, null, 2))
} catch (error) {
  console.error('ERROR', error)
}
