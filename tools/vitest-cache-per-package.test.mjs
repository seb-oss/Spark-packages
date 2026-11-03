import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'

const root = resolve(import.meta.dirname, '..')

const packageJsonPaths = [
  ...readdirSync(join(root, 'packages'))
    .map((name) => join('packages', name, 'package.json'))
    .filter((path) => existsSync(join(root, path))),
  join('turbo', 'generators', 'templates', 'package.json.hbs'),
]

// Without --fsModuleCachePath every vitest process shares the workspace root's
// node_modules/.vitest-cache. When the lockfile changes, each parallel process
// clears that directory while the others write to it, failing with ENOTEMPTY.
for (const path of packageJsonPaths) {
  test(`${path}: every vitest call uses its own module cache`, () => {
    const { scripts = {} } = JSON.parse(readFileSync(join(root, path), 'utf8'))

    const sharedCacheCalls = Object.entries(scripts)
      .flatMap(([name, script]) =>
        script.split('&&').map((command) => [name, command.trim()])
      )
      .filter(([, command]) => command.startsWith('vitest'))
      .filter(
        ([, command]) =>
          !command.includes('--fsModuleCachePath node_modules/.vitest-cache')
      )
      .map(([name]) => name)

    assert.deepEqual(sharedCacheCalls, [])
  })
}
