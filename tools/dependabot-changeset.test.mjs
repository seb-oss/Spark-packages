import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { needsRelease, renderChangeset } from './dependabot-changeset.mjs'

describe('needsRelease', () => {
  it('is true when a dependency version changes', () => {
    const before = { name: '@sebspark/a', dependencies: { x: '1.0.0' } }
    const after = { name: '@sebspark/a', dependencies: { x: '1.0.1' } }

    assert.equal(needsRelease(before, after), true)
  })

  it('is true when a peer dependency range changes', () => {
    const before = { name: '@sebspark/a', peerDependencies: { x: '^1.0.0' } }
    const after = { name: '@sebspark/a', peerDependencies: { x: '^2.0.0' } }

    assert.equal(needsRelease(before, after), true)
  })

  it('is true when an optional dependency changes', () => {
    const before = { name: '@sebspark/a', optionalDependencies: { x: '1.0.0' } }
    const after = { name: '@sebspark/a', optionalDependencies: { x: '2.0.0' } }

    assert.equal(needsRelease(before, after), true)
  })

  it('is false when only devDependencies change', () => {
    const before = { name: '@sebspark/a', devDependencies: { x: '1.0.0' } }
    const after = { name: '@sebspark/a', devDependencies: { x: '2.0.0' } }

    assert.equal(needsRelease(before, after), false)
  })

  it('is false for private packages', () => {
    const before = { name: 'root', private: true, dependencies: { x: '1.0.0' } }
    const after = { name: 'root', private: true, dependencies: { x: '2.0.0' } }

    assert.equal(needsRelease(before, after), false)
  })

  it('is false for packages that did not exist before', () => {
    const after = { name: '@sebspark/a', dependencies: { x: '1.0.0' } }

    assert.equal(needsRelease(undefined, after), false)
  })
})

describe('renderChangeset', () => {
  it('bumps every package as a patch with the summary', () => {
    const changeset = renderChangeset(
      ['@sebspark/a', '@sebspark/b'],
      'Bump x from 1.0.0 to 1.0.1'
    )

    assert.equal(
      changeset,
      `---
"@sebspark/a": patch
"@sebspark/b": patch
---

Bump x from 1.0.0 to 1.0.1
`
    )
  })
})
