/**
 * Publishes every workspace version missing from npm, retrying failed attempts,
 * then fails unless npm has every public workspace version.
 *
 * `changeset publish` stops at the first failure: packages that depend on an
 * unpublished package are never attempted and are not reported either. A rerun
 * only publishes what is still missing, with a fresh provenance signature, so
 * transient failures (e.g. Sigstore's "(409) an equivalent entry already exists")
 * are retried here.
 *
 * Usage: node tools/publish.mjs
 */
import { spawn } from 'node:child_process'
import { globSync, readFileSync } from 'node:fs'
import { setTimeout } from 'node:timers/promises'

/**
 * @param {() => Promise<number>} publish resolves to the exit code
 * @param {{ attempts: number }} options
 */
export const publishWithRetries = async (publish, { attempts }) => {
  let exitCode = 1
  for (let attempt = 1; attempt <= attempts; attempt++) {
    exitCode = await publish()
    if (exitCode === 0) return 0
    console.error(`Publish attempt ${attempt} of ${attempts} failed`)
  }
  return exitCode
}

/**
 * @param {{ name: string, version: string }[]} packages
 * @param {(name: string) => Promise<string[]>} getPublishedVersions
 * @returns {Promise<string[]>} `name@version` of every package not on npm
 */
export const findMissingVersions = async (packages, getPublishedVersions) => {
  const missing = []
  for (const { name, version } of packages) {
    const published = await getPublishedVersions(name)
    if (!published.includes(version)) missing.push(`${name}@${version}`)
  }
  return missing
}

const publicPackages = () =>
  globSync('packages/*/package.json')
    .map((file) => JSON.parse(readFileSync(file, 'utf8')))
    .filter((pkg) => pkg.private !== true)

const getPublishedVersions = async (name) => {
  const response = await fetch(`https://registry.npmjs.org/${name}`, {
    headers: { Accept: 'application/vnd.npm.install-v1+json' },
  })
  if (response.status === 404) return []
  if (!response.ok) {
    throw new Error(`npm registry answered ${response.status} for ${name}`)
  }
  const { versions } = await response.json()
  return Object.keys(versions)
}

const changesetPublish = () =>
  new Promise((resolve, reject) => {
    spawn('npx', ['changeset', 'publish'], { stdio: 'inherit' })
      .on('error', reject)
      .on('exit', (code) => resolve(code ?? 1))
  })

// npm can take a minute before a just-published version is listed.
const waitForMissingVersions = async (packages) => {
  const deadline = Date.now() + 5 * 60_000
  let missing = await findMissingVersions(packages, getPublishedVersions)
  while (missing.length > 0 && Date.now() < deadline) {
    await setTimeout(15_000)
    missing = await findMissingVersions(packages, getPublishedVersions)
  }
  return missing
}

if (import.meta.main) {
  const exitCode = await publishWithRetries(changesetPublish, { attempts: 3 })
  const missing = await waitForMissingVersions(publicPackages())
  if (missing.length > 0) {
    console.error(`Not on npm after publishing:\n${missing.join('\n')}`)
    process.exit(1)
  }
  process.exit(exitCode)
}
