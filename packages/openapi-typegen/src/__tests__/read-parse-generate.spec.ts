import { readFileSync } from 'fs'
import { test, expect } from 'vitest'
import { OpenApiDocument } from '@sebspark/openapi-core'
import { generateTypescript } from '..'
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
