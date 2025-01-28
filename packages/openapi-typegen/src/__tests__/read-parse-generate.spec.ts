import { readFileSync, writeFileSync } from 'node:fs'
import type { OpenApiDocument } from '@sebspark/openapi-core'
import { expect, test } from 'vitest'
import * as YAML from 'yaml'
import { classname, generateTypescript } from '..'
import { format } from '../generator'

test('generate components.json', async () => {
  const source = `${__dirname}/components.json`
  const dest = `${__dirname}/components.generated.ts`

  const doc = JSON.parse(readFileSync(source, 'utf8')) as OpenApiDocument
  const generated = await generateTypescript('ExampleAPI', doc)

  // overwrite destination
  // writeFileSync(dest, generated)

  const expected = await format(readFileSync(dest, 'utf8'))

  expect(generated).toEqual(expected)
})

test('generate openapi.json', async () => {
  const source = `${__dirname}/openapi.json`
  const dest = `${__dirname}/openapi.generated.ts`

  const doc = JSON.parse(readFileSync(source, 'utf8')) as OpenApiDocument
  const generated = await generateTypescript('CardsAPI', doc)

  // overwrite destination
  // writeFileSync(dest, generated)

  const expected = await format(readFileSync(dest, 'utf8'))

  expect(generated).toEqual(expected)
})

test.skip('generate cdapi-service.openapi-3.0.yaml', async () => {
  const source = `${__dirname}/cdapi-service.openapi-3.0.yaml`
  const dest = `${__dirname}/cdapi-service_openapi-3_0.generated.ts`

  const doc = YAML.parse(readFileSync(source, 'utf8')) as OpenApiDocument
  const generated = await generateTypescript(
    classname('cdapi-service.openapi-3.0'),
    doc
  )

  // overwrite destination
  // writeFileSync(dest, generated)

  const expected = await format(readFileSync(dest, 'utf8'))

  expect(generated).toEqual(expected)
})
