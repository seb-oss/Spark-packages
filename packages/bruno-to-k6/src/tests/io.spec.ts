// src/io.spec.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs/promises'
import { ensureDir, readText, writeText } from '../io'

let tmpRoot: string

beforeAll(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bruno-to-k6-io-'))
})

afterAll(async () => {
  // clean up the whole temp tree
  await fs.rm(tmpRoot, { recursive: true, force: true })
})

describe('io helpers', () => {
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
})
