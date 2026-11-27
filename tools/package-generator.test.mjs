import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { after, before, describe, test } from 'node:test'

const root = resolve(import.meta.dirname, '..')
const bin = (name) => join(root, 'node_modules', '.bin', name)
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))
const rootVersion = (name) =>
  readJson(join(root, 'package.json')).devDependencies[name]

// A copy of the repo root to generate into, so the repo itself is untouched.
// It links the repo's node_modules so a generated package finds its tools.
let workspace

before(() => {
  workspace = realpathSync(mkdtempSync(join(tmpdir(), 'package-generator-')))
  symlinkSync(join(root, 'node_modules'), join(workspace, 'node_modules'))
  for (const file of ['package.json', 'turbo.json', 'README.md']) {
    cpSync(join(root, file), join(workspace, file))
  }
  cpSync(join(root, 'turbo', 'generators'), join(workspace, 'turbo', 'generators'), {
    recursive: true,
  })
  mkdirSync(join(workspace, 'packages'))
})

after(() => rmSync(workspace, { recursive: true, force: true }))

describe('a package created with yarn generate:package', () => {
  let generated

  before(() => {
    // What `yarn generate:package` runs, answering name and description
    execFileSync(
      bin('turbo'),
      ['gen', 'package', '--root', workspace, '--args', 'generated', 'Generated'],
      { stdio: 'pipe' }
    )
    generated = join(workspace, 'packages', 'generated')
  })

  // tsdown silently falls back to package.json when it finds no config file
  // it reads, which skips the shared @sebspark/tsconfig/tsdown config.
  test('builds with its own tsdown config', () => {
    const output = execFileSync(bin('spark-build'), ['src/index.ts'], {
      cwd: generated,
      encoding: 'utf8',
      stdio: 'pipe',
    })

    const configFile = output.match(/config file: (\S+)/)?.[1]
    assert.ok(configFile, `tsdown reported no config file:\n${output}`)
    assert.equal(dirname(configFile), generated)
    assert.notEqual(configFile, join(generated, 'package.json'))
  })

  test('declares the tools its scripts run, at the root versions', () => {
    const { devDependencies } = readJson(join(generated, 'package.json'))

    assert.deepEqual(devDependencies, {
      '@biomejs/biome': rootVersion('@biomejs/biome'), // lint
      '@sebspark/tsconfig': rootVersion('@sebspark/tsconfig'), // build: spark-build
      typescript: rootVersion('typescript'), // dev, typecheck: tsc
      vitest: rootVersion('vitest'), // test, typecheck
      vite: rootVersion('vite'), // required by vitest
    })
  })
})
