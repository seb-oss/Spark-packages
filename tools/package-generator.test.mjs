import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { after, before, test } from 'node:test'

const root = resolve(import.meta.dirname, '..')
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))
const rootPackage = readJson(join(root, 'package.json'))

// The generator runs against a copy of the repo root, so the test checks what
// `yarn generate:package` really writes without touching the repo. The copy
// links the repo's node_modules so the generated package resolves its tools.
let workspace
let generated

before(() => {
  workspace = realpathSync(mkdtempSync(join(tmpdir(), 'package-generator-')))
  symlinkSync(join(root, 'node_modules'), join(workspace, 'node_modules'))
  for (const file of ['package.json', 'turbo.json', 'README.md']) {
    cpSync(join(root, file), join(workspace, file))
  }
  cpSync(
    join(root, 'turbo', 'generators'),
    join(workspace, 'turbo', 'generators'),
    { recursive: true }
  )
  mkdirSync(join(workspace, 'packages'))
  execFileSync(
    join(root, 'node_modules', '.bin', 'turbo'),
    ['gen', 'package', '--root', workspace, '--args', 'generated', 'Generated'],
    { stdio: 'pipe' }
  )
  generated = join(workspace, 'packages', 'generated')
})

after(() => rmSync(workspace, { recursive: true, force: true }))

// tsdown silently falls back to package.json when it finds no config file it
// reads, which skips the shared @sebspark/tsconfig/tsdown config.
test('generated package builds with its own tsdown config', () => {
  const output = execFileSync(
    join(root, 'node_modules', '.bin', 'spark-build'),
    ['src/index.ts'],
    { cwd: generated, encoding: 'utf8', stdio: 'pipe' }
  )

  const configFile = output.match(/config file: (\S+)/)?.[1]

  assert.ok(configFile, `tsdown reported no config file:\n${output}`)
  assert.equal(dirname(configFile), generated)
  assert.notEqual(configFile, join(generated, 'package.json'))
})

const owningPackage = (file) => {
  let dir = dirname(file)
  while (!existsSync(join(dir, 'package.json')) || !readJson(join(dir, 'package.json')).name) {
    dir = dirname(dir)
  }
  return readJson(join(dir, 'package.json'))
}

test('generated package declares every package its scripts run, at the root version', () => {
  const { scripts, devDependencies = {} } = readJson(
    join(generated, 'package.json')
  )

  const commands = new Set(
    Object.values(scripts)
      .flatMap((script) => script.split('&&'))
      .map((command) => command.trim().split(' ')[0])
  )

  const required = new Set()
  for (const command of commands) {
    const bin = join(root, 'node_modules', '.bin', command)
    if (!existsSync(bin)) continue
    const owner = owningPackage(realpathSync(bin))
    required.add(owner.name)
    for (const peer of Object.keys(owner.peerDependencies ?? {})) {
      if (!owner.peerDependenciesMeta?.[peer]?.optional) required.add(peer)
    }
  }

  const expected = Object.fromEntries(
    [...required].map((name) => [name, rootPackage.devDependencies[name]])
  )

  assert.deepEqual(devDependencies, expected)
})
