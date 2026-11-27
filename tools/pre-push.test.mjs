import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, test } from 'node:test'

// .husky/pre-push runs yarn smoketest on pushes to main and must block the
// push when it fails. A fake yarn stands in for smoketest.

const hook = resolve(import.meta.dirname, '..', '.husky', 'pre-push')
const sha = 'a'.repeat(40)

let bin

beforeEach(() => {
  bin = mkdtempSync(join(tmpdir(), 'pre-push-'))
})

afterEach(() => rmSync(bin, { recursive: true, force: true }))

const smoketestExits = (code) => {
  writeFileSync(join(bin, 'yarn'), `#!/bin/sh\necho "yarn $*"\nexit ${code}\n`)
  chmodSync(join(bin, 'yarn'), 0o755)
}

// git feeds the hook one line per ref: <local ref> <local sha> <remote ref> <remote sha>.
// Husky runs hooks with `sh -e` (node_modules/husky/husky), so the test does too.
const push = (...remoteRefs) =>
  spawnSync('sh', ['-e', hook], {
    input: remoteRefs.map((ref) => `refs/heads/x ${sha} ${ref} ${sha}\n`).join(''),
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
    encoding: 'utf8',
  })

test('allows a push to main when smoketest passes', () => {
  smoketestExits(0)

  const result = push('refs/heads/main')

  assert.equal(result.status, 0)
  assert.match(result.stdout, /yarn smoketest/)
})

test('blocks a push to main when smoketest fails', () => {
  smoketestExits(1)

  const result = push('refs/heads/main')

  assert.notEqual(result.status, 0)
})

test('blocks a push to main and a tag together when smoketest fails', () => {
  smoketestExits(1)

  const result = push('refs/heads/main', 'refs/tags/v1')

  assert.notEqual(result.status, 0)
})

test('does not run smoketest for pushes to other refs', () => {
  smoketestExits(1)

  const result = push('refs/tags/v1')

  assert.equal(result.status, 0)
  assert.doesNotMatch(result.stdout, /yarn smoketest/)
})
