import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, test } from 'node:test'

const script = resolve(import.meta.dirname, 'check-licenses.mjs')

// A repo root with a packages folder, to run the check in
let root

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'check-licenses-'))
  mkdirSync(join(root, 'packages'))
})

afterEach(() => rmSync(root, { recursive: true, force: true }))

const addPackage = (name, packageJson) => {
  mkdirSync(join(root, 'packages', name))
  writeFileSync(join(root, 'packages', name, 'package.json'), packageJson)
}

const checkLicenses = () =>
  spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8' })

test('passes when every package is Apache-2.0', () => {
  addPackage('good', JSON.stringify({ license: 'Apache-2.0' }))

  const result = checkLicenses()

  assert.equal(result.status, 0)
  assert.equal(result.stderr, '')
})

test('fails for a package with another license', () => {
  addPackage('good', JSON.stringify({ license: 'Apache-2.0' }))
  addPackage('bad', JSON.stringify({ license: 'MIT' }))

  const result = checkLicenses()

  assert.equal(result.status, 1)
  assert.match(result.stderr, /"bad" has an invalid license: "MIT"/)
})

test('fails for a package.json it cannot parse', () => {
  addPackage('broken', '{ "license": ')

  const result = checkLicenses()

  assert.equal(result.status, 1)
  assert.match(result.stderr, /broken/)
})

test('skips files and folders that are not packages, without a word', () => {
  addPackage('good', JSON.stringify({ license: 'Apache-2.0' }))
  // Finder writes .DS_Store; a removed package can leave its node_modules behind
  writeFileSync(join(root, 'packages', '.DS_Store'), '')
  mkdirSync(join(root, 'packages', 'removed', 'node_modules'), { recursive: true })

  const result = checkLicenses()

  assert.equal(result.status, 0)
  assert.equal(result.stderr, '')
})
