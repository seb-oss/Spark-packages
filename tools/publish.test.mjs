import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { findMissingVersions, publishWithRetries } from './publish.mjs'

describe('publishWithRetries', () => {
  it('publishes once when the first attempt succeeds', async () => {
    let calls = 0
    const publish = async () => {
      calls++
      return 0
    }

    const exitCode = await publishWithRetries(publish, { attempts: 3 })

    assert.equal(exitCode, 0)
    assert.equal(calls, 1)
  })

  it('retries a failed publish until it succeeds', async () => {
    const exitCodes = [1, 1, 0]
    let calls = 0
    const publish = async () => exitCodes[calls++]

    const exitCode = await publishWithRetries(publish, { attempts: 3 })

    assert.equal(exitCode, 0)
    assert.equal(calls, 3)
  })

  it('gives up after the last attempt and returns its exit code', async () => {
    let calls = 0
    const publish = async () => {
      calls++
      return 1
    }

    const exitCode = await publishWithRetries(publish, { attempts: 3 })

    assert.equal(exitCode, 1)
    assert.equal(calls, 3)
  })
})

describe('findMissingVersions', () => {
  it('lists packages whose version is not on npm', async () => {
    const packages = [
      { name: '@sebspark/a', version: '1.0.1' },
      { name: '@sebspark/b', version: '2.0.0' },
    ]
    const published = {
      '@sebspark/a': ['1.0.0'],
      '@sebspark/b': ['1.0.0', '2.0.0'],
    }
    const getPublishedVersions = async (name) => published[name]

    const missing = await findMissingVersions(packages, getPublishedVersions)

    assert.deepEqual(missing, ['@sebspark/a@1.0.1'])
  })

  it('lists a package that has never been published', async () => {
    const packages = [{ name: '@sebspark/new', version: '0.1.0' }]
    const getPublishedVersions = async () => []

    const missing = await findMissingVersions(packages, getPublishedVersions)

    assert.deepEqual(missing, ['@sebspark/new@0.1.0'])
  })

  it('is empty when every version is on npm', async () => {
    const packages = [{ name: '@sebspark/a', version: '1.0.0' }]
    const getPublishedVersions = async () => ['1.0.0']

    const missing = await findMissingVersions(packages, getPublishedVersions)

    assert.deepEqual(missing, [])
  })
})
