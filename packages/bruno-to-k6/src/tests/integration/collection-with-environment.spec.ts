import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { convertBrunoFileOrCollection } from '../../main'
import { fixturePaths, matchOrCreate } from '../helpers'
import { flatten, readCollection } from '../../collection'

const { FIX, EXP, EXP_PR } = fixturePaths(
  __dirname,
  'collection-with-environment'
)

const collection = flatten(readCollection(FIX).children).map((fr) => fr.path)

describe(`integration: collection-with-environment`, () => {
  it('generates a single file for a collection', async () => {
    const { main } = await convertBrunoFileOrCollection(FIX, {
      brunoEnvironmentName: 'DEV',
      separate: false,
    })

    await matchOrCreate(path.join(EXP, 'main.js'), main)
  })

  it.each(collection)(
    'generates a single file for %s.bru',
    async (filename) => {
      const singleFile = path.join(FIX, `${filename}.bru`)

      const { main } = await convertBrunoFileOrCollection(singleFile, {
        brunoEnvironmentName: 'DEV',
        separate: false,
      })

      await matchOrCreate(path.join(EXP, `${filename}.js`), main)
    }
  )

  it('returns per-request files for a collection', async () => {
    const { main, requests } = await convertBrunoFileOrCollection(FIX, {
      brunoEnvironmentName: 'DEV',
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
