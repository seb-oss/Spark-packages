import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs/promises'
import { findBrunoRoot, listRequestFiles, resolveEnvFileByName } from '../project'

let tmpRoot: string
let root: string
let requestsDir: string
let nestedDir: string
let envDir: string
let fileA: string
let fileB: string
let fileC: string
let envDev: string
let envProd: string

async function touch(p: string, content = '') {
  await fs.mkdir(path.dirname(p), { recursive: true })
  await fs.writeFile(p, content, 'utf8')
}

beforeAll(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bruno-to-k6-project-'))

  // workspace layout
  root = path.join(tmpRoot, 'collection')
  requestsDir = path.join(root, 'requests')
  nestedDir = path.join(requestsDir, 'nested')
  envDir = path.join(root, 'environments')

  // minimal files
  await touch(path.join(root, 'bruno.json'), '{ "name": "Demo" }')

  fileA = path.join(requestsDir, 'a.bru')
  fileB = path.join(requestsDir, 'b.bru')
  fileC = path.join(nestedDir, 'c.bru')
  await touch(fileA, 'get { url: https://a.example }')
  await touch(fileB, 'get { url: https://b.example }')
  await touch(fileC, 'get { url: https://c.example }')

  envDev = path.join(envDir, 'dev.bru')
  envProd = path.join(envDir, 'prod.bru')
  await touch(envDev, 'vars { API_URL: https://dev }')
  await touch(envProd, 'vars { API_URL: https://prod }')
})

afterAll(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true })
})

describe('findBrunoRoot', () => {
  it('finds root when starting from the root directory', async () => {
    const r = await findBrunoRoot(root)
    expect(r).toBe(root)
  })
  it('finds root when starting from a nested directory', async () => {
    const r = await findBrunoRoot(nestedDir)
    expect(r).toBe(root)
  })
  it('finds root when starting from a .bru file path', async () => {
    const r = await findBrunoRoot(fileB)
    expect(r).toBe(root)
  })
  it('handles a non-existent starting path by walking up to root', async () => {
    // start from a path that does not exist under the collection
    const ghost = path.join(root, 'requests', 'deep', 'nope', 'missing.file')
    const r = await findBrunoRoot(ghost)
    expect(r).toBe(root)
  })
  it('throws when no bruno.json exists up the tree', async () => {
    const stray = path.join(tmpRoot, 'outside', 'foo')
    await fs.mkdir(stray, { recursive: true })
    await expect(findBrunoRoot(stray)).rejects.toBeTruthy()
  })
})

describe('listRequestFiles', () => {
  it('lists all .bru requests under the root (excluding environments), sorted by path', async () => {
    const files = await listRequestFiles(root, root)
    // Expect absolute, sorted paths
    expect(files).toEqual([fileA, fileB, fileC].sort())
  })
  it('lists only .bru requests under a nested directory input', async () => {
    const files = await listRequestFiles(nestedDir, root)
    expect(files).toEqual([fileC])
  })
  it('returns the single file when input is a .bru file', async () => {
    const files = await listRequestFiles(fileA, root)
    expect(files).toEqual([fileA])
  })
  it('throws when given a non-.bru file', async () => {
    const notBru = path.join(root, 'bruno.json') // exists and is a file, but not .bru
    await expect(listRequestFiles(notBru, root)).rejects.toBeTruthy()
  })
})

describe('resolveEnvFileByName', () => {
  it('resolves a known environment by name', async () => {
    const p = await resolveEnvFileByName(root, 'dev')
    expect(p).toBe(envDev)
  })
  it('throws when the environment file is missing', async () => {
    await expect(resolveEnvFileByName(root, 'missing')).rejects.toBeTruthy()
  })
  it('throws if the env path exists but is a directory', async () => {
    const asDir = path.join(root, 'environments', 'asdir.bru')
    await fs.mkdir(asDir, { recursive: true }) // create a directory with .bru suffix
    await expect(resolveEnvFileByName(root, 'asdir')).rejects.toBeTruthy()
  })
})
