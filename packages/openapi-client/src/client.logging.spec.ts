import nock from 'nock'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const logger = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
}))

vi.mock('@sebspark/otel', () => ({
  getLogger: () => logger,
}))

import type { ApiClient } from './__tests__/api'
import { TypedClient } from './client'

describe('TypedClient error logging', () => {
  const url = 'https://api.example.com'

  beforeEach(() => {
    nock.cleanAll()
    vi.clearAllMocks()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('logs a non-Error rejection from authorizationTokenGenerator as an Error', async () => {
    const apiClient = TypedClient<ApiClient>(url, {
      authorizationTokenGenerator: vi
        .fn()
        .mockRejectedValue('token service down'),
    })

    await expect(apiClient.get('/health')).rejects.toThrow()

    const [message, error] = logger.error.mock.calls[0]
    expect(message).toBe(`Error generating token for URL: ${url}/health`)
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('token service down')
  })

  it('logs a non-Error rejection from authorizationTokenRefresh as an Error', async () => {
    nock(url).get('/health').reply(401, { message: 'Unauthorized' })
    const apiClient = TypedClient<ApiClient>(url, {
      authorizationTokenGenerator: vi.fn().mockResolvedValue({}),
      authorizationTokenRefresh: vi.fn().mockRejectedValue('refresh down'),
    })

    await expect(apiClient.get('/health')).rejects.toThrow()

    const [message, error] = logger.error.mock.calls[0]
    expect(message).toBe(`Error refreshing token for URL: ${url}/health`)
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('refresh down')
  })
})
