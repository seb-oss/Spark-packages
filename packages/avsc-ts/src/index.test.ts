import { test } from 'vitest'
import fs from 'node:fs'
import { parseSchemas } from '.'

test('parseSchemas reads folder, parses schemas and saves the ts', () => {
  fs.rmSync('./testschemas', { recursive: true, force: true })
  fs.mkdirSync('./testschemas')

  parseSchemas({ inputpath: './examples', outputpath: './testschemas' })
})
