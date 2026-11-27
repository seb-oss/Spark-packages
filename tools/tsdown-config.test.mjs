import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'

const root = resolve(import.meta.dirname, '..')

const packageDirs = readdirSync(join(root, 'packages'))
  .map((name) => join('packages', name))
  .filter((dir) => existsSync(join(root, dir, 'package.json')))

// tsdown only loads files named tsdown.config.*. Without one it silently falls
// back to package.json and skips the shared @sebspark/tsconfig/tsdown config.
for (const dir of packageDirs) {
  const { scripts = {} } = JSON.parse(
    readFileSync(join(root, dir, 'package.json'), 'utf8')
  )
  if (!scripts.build?.includes('spark-build')) continue

  test(`${dir}: build has a tsdown config file`, () => {
    const configFiles = readdirSync(join(root, dir)).filter((file) =>
      file.startsWith('tsdown.config.')
    )

    assert.equal(configFiles.length, 1, `found: ${configFiles.join(', ')}`)
  })
}
