import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { expect, test } from 'vitest'
import { parseSchemas } from '.'

test('parseSchemas reads folder, parses schemas and saves the ts', () => {
  const outputpath = path.join(__dirname, '../testschemas')
  fs.rmSync(outputpath, { recursive: true, force: true })
  fs.mkdirSync(outputpath)

  parseSchemas({
    inputpath: path.join(__dirname, '../examples'),
    outputpath,
  })
})

test('parseSchemas uses inputpath as outputpath when outputpath is omitted', () => {
  const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'avsc-ts-test-'))
  const examplesDir = path.join(__dirname, '../examples')
  for (const f of fs.readdirSync(examplesDir)) {
    fs.copyFileSync(path.join(examplesDir, f), path.join(tmpdir, f))
  }

  parseSchemas({ inputpath: tmpdir })

  const output = fs.readdirSync(tmpdir)
  expect(output.some((f) => f.endsWith('.ts'))).toBe(true)

  fs.rmSync(tmpdir, { recursive: true })
})
