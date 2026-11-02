import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'

const root = resolve(import.meta.dirname, '..')
const tsc = join(root, 'node_modules', '.bin', 'tsc')

const packagesWithTsconfig = readdirSync(join(root, 'packages')).filter(
  (name) => existsSync(join(root, 'packages', name, 'tsconfig.json'))
)

// Typecheck runs in parallel with the package's own build, which empties dist.
// A program that includes its own dist fails intermittently with TS6053.
for (const name of packagesWithTsconfig) {
  test(`${name}: typecheck does not include its own build output`, () => {
    const dir = join(root, 'packages', name)
    const files = execFileSync(
      tsc,
      ['-p', dir, '--noEmit', '--listFilesOnly'],
      { encoding: 'utf8' }
    ).split('\n')

    const ownOutput = files.filter(
      (file) =>
        file.startsWith(join(dir, 'dist') + '/') ||
        file.startsWith(join(dir, 'build') + '/')
    )

    assert.deepEqual(ownOutput, [])
  })
}
