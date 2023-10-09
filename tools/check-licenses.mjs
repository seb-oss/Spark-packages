#!/bin/node
/* eslint-disable */

import fs from 'fs/promises'
import path from 'path'

const packages = await fs.readdir(path.resolve(process.cwd(), './packages'))

// TODO: Update this list with allowed licenses.
// It currently uses the ones we have to not break the build.
const allowedLicenses = ['MIT', 'UNLICENSED']
let hasInvalidLicenses = false

for (const pkg of packages) {
  try {
    let pkgJson = await fs.readFile(
      path.resolve(process.cwd(), './packages', pkg, 'package.json'),
      'utf8',
    )
    pkgJson = JSON.parse(pkgJson)

    if (!allowedLicenses.includes(pkgJson.license)) {
      console.error(
        `Package "${pkg}" has an invalid license: "${pkgJson.license}"`,
      )
      hasInvalidLicenses = true
    }
  } catch (e) {
    console.error(e)
  }
}

if (hasInvalidLicenses) {
  process.exit(1)
}
