import { HttpError } from '@sebspark/openapi-core'
import { AxiosError } from 'axios'
import nock from 'nock'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TypedClient } from '../client'
import { ApiClient } from './api'

describe('Auth Retry Tests', () => {
  const url = 'https://api.example.com'

  let server = nock(url)

  beforeEach(() => {
    nock.cleanAll()
  })

  afterEach(() => {
    nock.cleanAll()
    vi.clearAllMocks()
  })

  const authorizationTokenGeneratorMock = vi.fn()
  const authorizationTokenRefreshMock = vi.fn()

  describe('with authorization functions', () => {
    const apiClient = TypedClient<ApiClient>(url, {
      authorizationTokenGenerator: authorizationTokenGeneratorMock,
      authorizationTokenRefresh: authorizationTokenRefreshMock,
    })

    it('should refresh token and retry on auth failure', async () => {
      authorizationTokenGeneratorMock.mockResolvedValue({
        'Proxy-auth': 'Bearer 123',
      })

      server
        .get('/health')
        .reply(401, { message: 'Unauthorized' })
        .get('/health')
        .reply(200, {})

      // Your test logic here
      await apiClient.get('/health')
      expect(authorizationTokenRefreshMock).toHaveBeenCalledOnce()
      expect(authorizationTokenGeneratorMock).toBeCalledTimes(2)

      expect(server.isDone()).to.be.true
    })

    it('should only retry once', async () => {
      authorizationTokenGeneratorMock.mockResolvedValue({
        'Proxy-auth': 'Bearer 123',
      })

      server
        .get('/health')
        .reply(401, { message: 'Unauthorized' })
        .get('/health')
        .reply(401, { message: 'Unauthorized' })

      // Your test logic here
      try {
        await apiClient.get('/health')
        expect(false).toBe(true)
      } catch (error) {
        expect(((error as HttpError).cause as AxiosError).cause?.message).toBe(
          'Unauthorized'
        )

        expect(authorizationTokenRefreshMock).toHaveBeenCalledOnce()
        expect(authorizationTokenGeneratorMock).toBeCalledTimes(2)
      }

      expect(server.isDone()).to.be.true
    })
  })

  describe('without authorization functions', () => {
    const apiClient = TypedClient<ApiClient>(url)

    it('should work', async () => {
      server.get('/health').reply(200, {})

      // Your test logic here
      await apiClient.get('/health')

      expect(server.isDone()).to.be.true
    })
  })
})
