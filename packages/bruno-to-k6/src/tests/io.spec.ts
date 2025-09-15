import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
// src/io.spec.ts
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ensureDir, readText, writeText } from '../io'
import { createFileStructure } from './helpers'

let tmpRoot: string

describe('io helpers', () => {
  beforeAll(async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bruno-to-k6-io-'))

    // Use helper to prepopulate some test files/dirs
    createFileStructure(tmpRoot, {
      'preexisting.txt': 'hello world',
      nested: {
        'deep.txt': 'deep content',
      },
    })
  })
  afterAll(async () => {
    // clean up the whole temp tree
    await fs.rm(tmpRoot, { recursive: true, force: true })
  })
  it('writes and reads UTF-8 text round-trip', async () => {
    const file = path.join(tmpRoot, 'roundtrip.txt')
    const data = 'hello åäö — emoji 🚀\nsecond line'
    await writeText(file, data)
    const got = await readText(file)
    expect(got).toBe(data)
  })
  it('overwrites existing file content', async () => {
    const file = path.join(tmpRoot, 'overwrite.txt')
    await writeText(file, 'old')
    await writeText(file, 'new')
    const got = await readText(file)
    expect(got).toBe('new')
  })
  it('creates parent directories when writing', async () => {
    const file = path.join(tmpRoot, 'deep', 'nested', 'dir', 'file.txt')
    await writeText(file, 'content')
    const got = await readText(file)
    expect(got).toBe('content')
  })
  it('ensureDir creates a directory recursively and is idempotent', async () => {
    const dir = path.join(tmpRoot, 'ensure', 'nested', 'dir')
    await ensureDir(dir)
    // calling again should not throw
    await ensureDir(dir)

    // and we can write a file inside it
    const file = path.join(dir, 'ok.txt')
    await writeText(file, 'ok')
    const got = await readText(file)
    expect(got).toBe('ok')
  })
  it('readText rejects when the file does not exist', async () => {
    const missing = path.join(tmpRoot, 'does-not-exist.txt')
    await expect(readText(missing)).rejects.toBeTruthy()
  })
  it('can read files created with createFileStructure', async () => {
    const file = path.join(tmpRoot, 'nested', 'deep.txt')
    const got = await readText(file)
    expect(got).toBe('deep content')
  })
})
