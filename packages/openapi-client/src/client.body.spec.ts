import type { BaseClient } from '@sebspark/openapi-core'
import nock from 'nock'
import { afterEach, describe, expect, it } from 'vitest'
import { TypedClient } from './client'

describe('TypedClient request body', () => {
  const url = 'https://api.example.com'

  afterEach(() => {
    nock.cleanAll()
  })

  it('sends an object body with non-string values unchanged', async () => {
    let received: unknown
    nock(url)
      .post('/users', (body) => {
        received = body
        return true
      })
      .reply(201, {})
    const client = TypedClient<BaseClient>(url)

    await client.post('/users', { body: { name: 'Ada', age: 36 } })

    expect(received).toEqual({ name: 'Ada', age: 36 })
  })

  it('sends an empty object when no body is given', async () => {
    let received: unknown
    nock(url)
      .post('/ping', (body) => {
        received = body
        return true
      })
      .reply(200, {})
    const client = TypedClient<BaseClient>(url)

    await client.post('/ping')

    expect(received).toEqual({})
  })

  it('sends an array body as an array', async () => {
    let received: unknown
    nock(url)
      .post('/users/batch', (body) => {
        received = body
        return true
      })
      .reply(201, {})
    const client = TypedClient<BaseClient>(url)

    await client.post('/users/batch', {
      body: [{ name: 'Ada' }, { name: 'Grace' }],
    })

    expect(received).toEqual([{ name: 'Ada' }, { name: 'Grace' }])
  })
})
