import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { classname, filename, generate } from '../index'

describe('cli', () => {
  describe('filename', () => {
    it('returns the same name for regular filename', () => {
      expect(filename('foobar')).toEqual('foobar')
    })
    it('returns a working name for weird filename', () => {
      expect(filename('cdapi-service.openapi-3.0')).toEqual(
        'cdapi-service_openapi-3_0'
      )
    })
  })

  describe('classname', () => {
    it('converts kebab-case to PascalCase and strips digits', () => {
      expect(classname('my-api-3')).toEqual('MyApi')
    })
    it('handles already pascalCase names', () => {
      expect(classname('MyApi')).toEqual('MyApi')
    })
  })

  describe('generate', () => {
    const minimalDoc = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          Foo: { type: 'string' },
        },
      },
    })

    it('generates TypeScript string from a single JSON file when no output is given', async () => {
      const dir = mkdtempSync(join(tmpdir(), 'typegen-'))
      const input = join(dir, 'test.json')
      writeFileSync(input, minimalDoc, 'utf8')
      try {
        const result = await generate(input)
        expect(typeof result).toBe('string')
        expect(result).toContain('export type')
      } finally {
        rmSync(dir, { recursive: true })
      }
    })

    it('generates TypeScript string from a YAML file', async () => {
      const dir = mkdtempSync(join(tmpdir(), 'typegen-'))
      const input = join(dir, 'test.yaml')
      writeFileSync(
        input,
        'openapi: "3.0.0"\ninfo:\n  title: Test\n  version: 1.0.0\npaths: {}\ncomponents:\n  schemas:\n    Foo:\n      type: string\n',
        'utf8'
      )
      try {
        const result = await generate(input)
        expect(typeof result).toBe('string')
        expect(result).toContain('export type')
      } finally {
        rmSync(dir, { recursive: true })
      }
    })

    it('generates TypeScript string from a .yml file', async () => {
      const dir = mkdtempSync(join(tmpdir(), 'typegen-'))
      const input = join(dir, 'test.yml')
      writeFileSync(
        input,
        'openapi: "3.0.0"\ninfo:\n  title: Test\n  version: 1.0.0\npaths: {}\ncomponents:\n  schemas:\n    Bar:\n      type: string\n',
        'utf8'
      )
      try {
        const result = await generate(input)
        expect(typeof result).toBe('string')
        expect(result).toContain('export type')
      } finally {
        rmSync(dir, { recursive: true })
      }
    })

    it('generates from a directory of JSON files', async () => {
      const inDir = mkdtempSync(join(tmpdir(), 'typegen-in-'))
      writeFileSync(join(inDir, 'a.json'), minimalDoc, 'utf8')
      writeFileSync(join(inDir, 'skip.txt'), 'ignored', 'utf8')
      try {
        const result = await generate(inDir)
        expect(typeof result).toBe('string')
      } finally {
        rmSync(inDir, { recursive: true })
      }
    })

    it('writes output files when output directory is given', async () => {
      const inDir = mkdtempSync(join(tmpdir(), 'typegen-in-'))
      const outDir = mkdtempSync(join(tmpdir(), 'typegen-out-'))
      writeFileSync(join(inDir, 'a.json'), minimalDoc, 'utf8')
      try {
        await generate(inDir, outDir)
        const written = readFileSync(join(outDir, 'a.ts'), 'utf8')
        expect(written).toContain('export type')
      } finally {
        rmSync(inDir, { recursive: true })
        rmSync(outDir, { recursive: true })
      }
    })

    it('writes output file when output is a file path', async () => {
      const inDir = mkdtempSync(join(tmpdir(), 'typegen-in-'))
      const outDir = mkdtempSync(join(tmpdir(), 'typegen-out-'))
      const outFile = join(outDir, 'a.ts')
      writeFileSync(join(inDir, 'a.json'), minimalDoc, 'utf8')
      // Pass a file path (not a directory) as output — covers stats.isDirectory() false branch
      writeFileSync(outFile, '', 'utf8')
      try {
        await generate(inDir, outFile)
        const written = readFileSync(outFile, 'utf8')
        expect(written).toContain('export type')
      } finally {
        rmSync(inDir, { recursive: true })
        rmSync(outDir, { recursive: true })
      }
    })
  })
})
