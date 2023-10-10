import { test } from 'vitest'
import { mkdirSync } from 'fs'
import { parseSchemas } from '.'

test('parseSchemas reads folder, parses schemas and saves the ts', () => {
  mkdirSync('./testschemas')
  parseSchemas({ inputpath: './examples', outputpath: './testschemas' })
})
