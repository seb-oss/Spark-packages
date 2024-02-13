import { readFileSync, writeFileSync } from 'fs'
import { OpenApiDocument } from '@sebspark/openapi-core'
import { expect, test } from 'vitest'
import * as YAML from 'yaml'
import { classname, generateTypescript } from '..'
import { format } from '../generator'

test('generate components.json', async () => {
  const doc = JSON.parse(
    readFileSync(`${__dirname}/components.json`, 'utf8')
  ) as OpenApiDocument
  const generated = await generateTypescript('ExampleAPI', doc)
  const expected = await format(
    readFileSync(`${__dirname}/components.generated.ts`, 'utf8')
  )

  expect(generated).toEqual(expected)
})

test('generate openapi.json', async () => {
  const doc = JSON.parse(
    readFileSync(`${__dirname}/openapi.json`, 'utf8')
  ) as OpenApiDocument
  const generated = await generateTypescript('CardsAPI', doc)
  const expected = await format(
    readFileSync(`${__dirname}/openapi.generated.ts`, 'utf8')
  )

  expect(generated).toEqual(expected)
})

test('generate cdapi-service.openapi-3.0.yaml', async () => {
  const doc = YAML.parse(
    readFileSync(`${__dirname}/cdapi-service.openapi-3.0.yaml`, 'utf8')
  ) as OpenApiDocument
  const generated = await generateTypescript(
    classname('cdapi-service.openapi-3.0'),
    doc
  )
  const expected = await format(
    readFileSync(`${__dirname}/cdapi-service_openapi-3_0.generated.ts`, 'utf8')
  )

  expect(generated).toEqual(expected)
})
