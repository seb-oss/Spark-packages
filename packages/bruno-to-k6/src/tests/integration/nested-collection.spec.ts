import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { flatten, readCollection } from '../../collection'
import { convertBrunoFileOrCollection } from '../../main'
import { fixturePaths, matchOrCreate } from '../helpers'

const { FIX, EXP, EXP_PR } = fixturePaths(__dirname, 'nested-collection')

const collection = flatten(readCollection(FIX).children).map((fr) => fr.path)

describe(`integration: nested-collection`, () => {
  it('generates a single file for a collection', async () => {
    const { main } = await convertBrunoFileOrCollection(FIX, {
      separate: false,
    })

    await matchOrCreate(path.join(EXP, 'main.js'), main)
  })

  it.each(collection)('generates a single file for %s.bru', async (filename) => {
    const singleFile = path.join(FIX, `${filename}.bru`)

    const { main } = await convertBrunoFileOrCollection(singleFile, {
      separate: false,
    })

    await matchOrCreate(path.join(EXP, `${filename}.js`), main)
  })

  it('returns per-request files for a collection', async () => {
    const { main, requests } = await convertBrunoFileOrCollection(FIX, {
      separate: true,
    })

    await matchOrCreate(path.join(EXP_PR, 'main.js'), main)

    expect(Array.isArray(requests)).toBe(true)
    for (const f of requests ?? []) {
      expect(f.filename.endsWith('.js')).toBe(true)
      expect(typeof f.contents).toBe('string')

      await matchOrCreate(path.join(EXP_PR, f.filename), f.contents)
    }
  })
})
