// tests/integration/simple-collection.spec.ts
import { describe, it, expect } from 'vitest'
import path from 'node:path'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { convertBrunoFileOrCollection } from '../../main'

// ESM __dirname shim
//const __filename = fileURLToPath(import.meta.url)
//const __dirname = path.dirname(__filename)

const FIX = path.join(__dirname, 'fixtures', 'simple-collection')
const EXP = path.join(FIX, 'expected')

const read = (p: string) => fs.readFile(p, 'utf8')
const norm = (s: string) => s.replace(/\r\n/g, '\n').trim()

describe('integration: simple-collection via main', () => {
  it('pointing at the collection directory returns main matching expected/main.js', async () => {
    // call main with the directory; no env, no separate, no output
    const { main } = await convertBrunoFileOrCollection(FIX, {
      separate: false,
    })

    const expected = await read(path.join(EXP, 'main.js'))
    expect(norm(main)).toBe(norm(expected))
  })

  it('pointing at a single .bru returns main matching expected/simple-get.js', async () => {
    // IMPORTANT: update this name if your single-file fixture is named differently
    const singleFile = path.join(FIX, 'simple-get.bru')

    const { main } = await convertBrunoFileOrCollection(singleFile, {
      separate: false,
    })

    const expected = await read(path.join(EXP, 'simple-get.js'))
    expect(norm(main)).toBe(norm(expected))
  })

  it('when separate=true returns per-request files (filenames only sanity check)', async () => {
    const { requests } = await convertBrunoFileOrCollection(FIX, {
      separate: true,
    })

    expect(Array.isArray(requests)).toBe(true)
    // loose check: we expect at least one emitted file, names end with .js
    expect((requests ?? []).length).toBeGreaterThan(0)
    for (const f of requests ?? []) {
      expect(f.filename.endsWith('.js')).toBe(true)
      expect(typeof f.contents).toBe('string')
      expect(f.contents.length).toBeGreaterThan(0)
    }
  })
})
