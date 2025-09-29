import type { Server } from 'node:http'
import express from 'express'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest'
import type { Logger } from 'winston'
import { type TypedAxiosClient, TypedClient } from './client'
import { accessToken, router } from './__tests__/client.helper'
import type { OpenapiClient, User } from './__tests__/openapi'

describe('TypedClient', () => {
  let client: TypedAxiosClient<OpenapiClient>
  let server: Server

  const headers = expect.any(Object)
  const PORT = 12345

  afterAll(() => {
    return new Promise<void>((resolve) => {
      server.close(() => resolve(undefined))
    })
  })

  beforeAll(() => {
    const app = express()
    app.use(router)
    return new Promise<void>((resolve) => {
      server = app.listen(PORT, () => resolve())
    })
  })

  describe('with default options', () => {
    beforeEach(() => {
      client = TypedClient<OpenapiClient>(`http://localhost:${PORT}`)
    })

    test('it works', async () => {
      // Users start out empty
      await expect(
        client.get('/users', { headers: { Authorization: accessToken } })
      ).resolves.toEqual({ data: [], headers })

      // Add a new user
      const user1: User = { id: '1', name: 'Alice', age: 20 }
      await expect(
        client.post('/users', {
          body: user1,
          headers: { Authorization: accessToken },
        })
      ).resolves.toEqual({
        data: user1,
        headers,
      })
      await expect(
        client.get('/users', { headers: { Authorization: accessToken } })
      ).resolves.toEqual({
        data: [user1],
        headers,
      })
      await expect(
        client.get('/users/:userId', {
          params: { userId: user1.id },
          headers: { Authorization: accessToken },
        })
      ).resolves.toEqual({ data: user1, headers })

      // Add another user
      const user2: User = { id: '2', name: 'Bob', age: 30 }
      await expect(
        client.post('/users', {
          body: user2,
          headers: { Authorization: accessToken },
        })
      ).resolves.toEqual({
        data: user2,
        headers,
      })
      await expect(
        client.get('/users', { headers: { Authorization: accessToken } })
      ).resolves.toEqual({
        data: [user1, user2],
        headers,
      })

      // Change user name
      user1.name = 'Carol'
      await expect(
        client.put('/users/:userId', {
          body: user1,
          params: { userId: '1' },
          headers: { Authorization: accessToken },
        })
      ).resolves.toEqual({ data: user1, headers })

      // Delete a user
      await expect(
        client.delete('/users/:userId', {
          params: { userId: '1' },
          headers: { Authorization: accessToken },
        })
      ).resolves.toEqual({ data: '', headers })
      await expect(
        client.get('/users', { headers: { Authorization: accessToken } })
      ).resolves.toEqual({
        data: [user2],
        headers,
      })
    })
    test('it supports undocumented headers', async () => {
      await expect(client.get('/undocumented-security')).rejects.toThrow()
      await expect(
        client.get('/undocumented-security', {
          headers: { authorization: accessToken },
        })
      ).resolves.toEqual({ data: '', headers })
      await expect(
        client.get(
          '/undocumented-security/:id',
          { params: { id: 'hello' } },
          { headers: { authorization: accessToken } }
        )
      ).resolves.toEqual({ data: '', headers })
    })

    describe('with authorizationTokenGenerator', () => {
      const authorizationTokenGeneratorMock = vi.fn()
      const loggerMock = {
        debug: vi.fn(),
      }
      const debugMock = vi.fn()

      beforeEach(() => {
        loggerMock.debug = debugMock
      })

      test('it works', async () => {
        const generatedHeaders = {
          'Proxy-Authorization': 'Bearer 123',
          'X-API-Key': 'a-1-b-2-c-3',
        }

        authorizationTokenGeneratorMock.mockResolvedValue(generatedHeaders)

        const client = TypedClient<OpenapiClient>(
          `http://localhost:${PORT}`,
          {
            authorizationTokenGenerator: authorizationTokenGeneratorMock,
          },
          loggerMock as unknown as Logger
        )

        try {
          await client.get('/users', {
            headers: { Authorization: accessToken },
          })
        } catch (error) {}

        expect(debugMock).toHaveBeenCalledWith(
          'Setting header Proxy-Authorization to Bearer 123'
        )
        expect(debugMock).toHaveBeenCalledWith(
          'Setting header X-API-Key to a-1-b-2-c-3'
        )
      })
    })
  })

  describe('with arrayFormat=comma', () => {
    beforeEach(() => {
      client = TypedClient<OpenapiClient>(`http://localhost:${PORT}`, {
        arrayFormat: 'comma',
      })
    })

    test('it works', async () => {
      const result = await client.get('/search', {
        query: { type: ['x', 'y'] },
      })

      expect(result.data.received).toEqual('x,y')
    })
  })

  describe('with arrayFormat=repeat', () => {
    beforeEach(() => {
      client = TypedClient<OpenapiClient>(`http://localhost:${PORT}`, {
        arrayFormat: 'repeat',
      })
    })

    test('it works', async () => {
      const result = await client.get('/search', {
        query: { type: ['x', 'y'] },
      })

      expect(result.data.received).toEqual(['x', 'y'])
    })
  })
})
