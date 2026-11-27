import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, test } from 'node:test'
import { promisify } from 'node:util'

// The release runs `changeset publish`, which publishes every public package
// whose version is not on npm. Trusted publishing cannot create a package, so
// a package that has never been published by hand (see "New packages" in
// CONTRIBUTING.md) fails the release at publish time, after its version
// commit is on main. This check runs before versioning, and in smoketest.

const script = resolve(import.meta.dirname, 'check-first-publish.mjs')

// A repo root with packages, and a registry that knows only the packages in
// `published`. Answers 500 for names in `broken`.
let root
let registry
let published
let broken

beforeEach(async () => {
  root = mkdtempSync(join(tmpdir(), 'check-first-publish-'))
  mkdirSync(join(root, 'packages'))
  published = new Set()
  broken = new Set()
  registry = createServer((request, response) => {
    const name = decodeURIComponent(request.url.slice(1))
    response.statusCode = broken.has(name) ? 500 : published.has(name) ? 200 : 404
    response.end('{}')
  })
  await new Promise((done) => registry.listen(0, '127.0.0.1', done))
})

afterEach(async () => {
  await new Promise((done) => registry.close(done))
  rmSync(root, { recursive: true, force: true })
})

const addPackage = (dir, packageJson) => {
  mkdirSync(join(root, 'packages', dir))
  writeFileSync(
    join(root, 'packages', dir, 'package.json'),
    JSON.stringify(packageJson)
  )
}

const checkFirstPublish = () =>
  promisify(execFile)(process.execPath, [script], {
    cwd: root,
    env: { ...process.env, NPM_REGISTRY: `http://127.0.0.1:${registry.address().port}` },
  }).then(
    ({ stdout, stderr }) => ({ code: 0, stdout, stderr }),
    ({ code, stdout, stderr }) => ({ code, stdout, stderr })
  )

test('passes when every public package is on npm', async () => {
  addPackage('retry', { name: '@sebspark/retry' })
  addPackage('otel', { name: '@sebspark/otel' })
  published.add('@sebspark/retry')
  published.add('@sebspark/otel')

  const result = await checkFirstPublish()

  assert.equal(result.code, 0)
  assert.equal(result.stderr, '')
})

test('fails for a public package that is not on npm, and says what to do', async () => {
  addPackage('retry', { name: '@sebspark/retry' })
  addPackage('pg-live', { name: '@sebspark/pg-live' })
  published.add('@sebspark/retry')

  const result = await checkFirstPublish()

  assert.equal(result.code, 1)
  assert.match(result.stderr, /@sebspark\/pg-live/)
  assert.doesNotMatch(result.stderr, /@sebspark\/retry/)
  assert.match(result.stderr, /New packages.*CONTRIBUTING\.md/)
})

test('skips private packages, which are never published', async () => {
  addPackage('openapi-e2e', { name: '@sebspark/openapi-e2e', private: true })

  const result = await checkFirstPublish()

  assert.equal(result.code, 0)
  assert.equal(result.stderr, '')
})

test('fails when the registry cannot answer, instead of assuming the package is there', async () => {
  addPackage('retry', { name: '@sebspark/retry' })
  broken.add('@sebspark/retry')

  const result = await checkFirstPublish()

  assert.equal(result.code, 1)
  assert.match(result.stderr, /500/)
})
