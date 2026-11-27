#!/bin/node

import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'

const packagesDir = path.resolve(process.cwd(), './packages')
const allowedLicenses = ['Apache-2.0']
let hasInvalidLicenses = false

// Only folders with a package.json are packages; anything else (.DS_Store, a
// removed package's leftover node_modules) is skipped. Every other error,
// such as a package.json that does not parse, ends the check with it.
const entries = await fs.readdir(packagesDir, { withFileTypes: true })
const packages = entries
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((pkg) => existsSync(path.join(packagesDir, pkg, 'package.json')))

for (const pkg of packages) {
  const file = path.join(packagesDir, pkg, 'package.json')
  let pkgJson
  try {
    pkgJson = JSON.parse(await fs.readFile(file, 'utf8'))
  } catch (error) {
    throw new Error(`Package "${pkg}": cannot read ${file}`, { cause: error })
  }

  if (!allowedLicenses.includes(pkgJson.license)) {
    console.error(`Package "${pkg}" has an invalid license: "${pkgJson.license}"`)
    hasInvalidLicenses = true
  }
}

if (hasInvalidLicenses) {
  process.exit(1)
}
