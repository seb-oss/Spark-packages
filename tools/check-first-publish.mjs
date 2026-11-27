#!/usr/bin/env node

// Fails when a public package is not on npm yet. The release runs
// `changeset publish`, which publishes every public package missing from npm,
// and trusted publishing cannot create a package, so the release would fail
// at publish time, after pushing its version commit. Runs before versioning
// in release.yml, and in smoketest. See "New packages" in CONTRIBUTING.md.

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const registry = process.env.NPM_REGISTRY ?? 'https://registry.npmjs.org'

const names = readdirSync(join(root, 'packages'))
  .map((dir) => join(root, 'packages', dir, 'package.json'))
  .filter((file) => existsSync(file))
  .map((file) => JSON.parse(readFileSync(file, 'utf8')))
  .filter((pkg) => !pkg.private)
  .map((pkg) => pkg.name)

const statuses = await Promise.all(
  names.map(async (name) => {
    const { status } = await fetch(`${registry}/${encodeURIComponent(name)}`)
    if (status !== 200 && status !== 404) {
      throw new Error(`${registry} answered ${status} for ${name}`)
    }
    return { name, status }
  })
)

const missing = statuses.filter(({ status }) => status === 404).map(({ name }) => name)
if (missing.length > 0) {
  console.error(
    `Not on npm yet: ${missing.join(', ')}. The release cannot create a package.\n` +
      'Publish it by hand and let it trust release.yml first: see "New packages" in CONTRIBUTING.md.'
  )
  process.exit(1)
}
