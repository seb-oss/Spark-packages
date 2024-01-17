import type { Server } from 'http'
import express from 'express'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { TypedClient } from './client'
import { Client, User, router } from './test/client.helper'

let client: Client
let server: Server

const PORT = 12345

beforeEach(() => {
  const app = express()
  app.use(router)
  client = TypedClient<Client>(`http://localhost:${PORT}`)
  return new Promise((resolve) => {
    server = app.listen(PORT, () => resolve())
  })
})
afterEach(() => {
  return new Promise((resolve) => {
    server.close(() => resolve())
  })
})

test('it works', async () => {
  const headers = expect.any(Object)
  // Users start out empty
  await expect(client.get('/users')).resolves.toEqual({ data: [], headers })

  // Add a new user
  const user1: User = { id: '1', name: 'Alice', age: 20 }
  await expect(client.post('/users', { body: user1 })).resolves.toEqual({
    data: user1,
    headers,
  })
  await expect(client.get('/users')).resolves.toEqual({
    data: [user1],
    headers,
  })
  await expect(
    client.get('/users/:id', { params: { id: '1' } })
  ).resolves.toEqual({ data: user1, headers })

  // Add another user
  const user2: User = { id: '2', name: 'Bob', age: 30 }
  await expect(client.post('/users', { body: user2 })).resolves.toEqual({
    data: user2,
    headers,
  })
  await expect(client.get('/users')).resolves.toEqual({
    data: [user1, user2],
    headers,
  })

  // Change user name
  user1.name = 'Carol'
  await expect(
    client.put('/users/:id', { body: user1, params: { id: '1' } })
  ).resolves.toEqual({ data: user1, headers })

  // Change user age
  user1.age = 25
  await expect(
    client.patch('/users/:id', { body: { age: 25 }, params: { id: '1' } })
  ).resolves.toEqual({ data: user1, headers })
  await expect(client.get('/users')).resolves.toEqual({
    data: [user1, user2],
    headers,
  })

  // Delete a user
  await expect(
    client.delete('/users/:id', { params: { id: '1' } })
  ).resolves.toEqual({ data: '', headers })
  await expect(client.get('/users')).resolves.toEqual({
    data: [user2],
    headers,
  })
})
