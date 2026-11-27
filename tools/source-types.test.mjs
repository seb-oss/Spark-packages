import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'

// Inside the repo, a package that imports another @sebspark package reads its
// types from source, so the editor jumps to the code and nothing needs building
// first. Each export names its source under the "@sebspark/source" condition,
// which each package's own tsconfig.json turns on. Nobody installing from npm
// sets that condition, and src is not published, so they get dist as before.

const root = resolve(import.meta.dirname, '..')
const condition = '@sebspark/source'
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))

const packageDirs = readdirSync(join(root, 'packages'))
  .map((name) => join('packages', name))
  .filter((dir) => existsSync(join(root, dir, 'tsconfig.json')))

for (const dir of packageDirs) {
  test(`${dir}: tsconfig.json turns on the ${condition} condition`, () => {
    const { compilerOptions = {} } = readJson(join(root, dir, 'tsconfig.json'))

    assert.deepEqual(compilerOptions.customConditions, [condition])
  })

  const { exports = {}, files = [] } = readJson(join(root, dir, 'package.json'))
  for (const [subpath, target] of Object.entries(exports)) {
    test(`${dir}: export ${subpath} names its source first, under ${condition}`, () => {
      const [first] = Object.keys(target)
      const types = target.types ?? target.import?.types
      const source = types
        .replace('./dist/', './src/')
        .replace(/\.d\.[mc]?ts$/, '.ts')

      // Conditions are tried in order, so it must come before types and import
      assert.equal(first, condition)
      assert.equal(target[condition], source)
      assert.ok(existsSync(join(root, dir, source)), `${source} does not exist`)
    })
  }

  if (Object.keys(exports).length > 0) {
    test(`${dir}: does not publish src, so installs from npm use dist`, () => {
      assert.ok(!files.some((file) => file.startsWith('src')), `files: ${files}`)
    })
  }
}
