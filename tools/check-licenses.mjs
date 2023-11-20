#!/bin/node
/* eslint-disable */

import path from 'path'
import fs from 'fs/promises'

const packages = await fs.readdir(path.resolve(process.cwd(), './packages'))
const allowedLicenses = ['Apache-2.0']
let hasInvalidLicenses = false

for (const pkg of packages) {
  try {
    let pkgJson = await fs.readFile(
      path.resolve(process.cwd(), './packages', pkg, 'package.json'),
      'utf8'
    )
    pkgJson = JSON.parse(pkgJson)

    if (!allowedLicenses.includes(pkgJson.license)) {
      console.error(
        `Package "${pkg}" has an invalid license: "${pkgJson.license}"`
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
