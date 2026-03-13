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
      expect(authorizationTokenGeneratorMock).toHaveBeenCalledTimes(2)

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
      } catch (err) {
        const error = err as HttpError
        const cause = error.cause as AxiosError
        expect((cause.cause as Error)?.message).toBe('Unauthorized')

        expect(authorizationTokenRefreshMock).toHaveBeenCalledOnce()
        expect(authorizationTokenGeneratorMock).toHaveBeenCalledTimes(2)
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

  describe('non-401 errors do not trigger refresh', () => {
    const apiClient = TypedClient<ApiClient>(url, {
      authorizationTokenGenerator: authorizationTokenGeneratorMock,
      authorizationTokenRefresh: authorizationTokenRefreshMock,
    })

    it('should not refresh on 403', async () => {
      authorizationTokenGeneratorMock.mockResolvedValue({
        'Proxy-auth': 'Bearer 123',
      })

      server.get('/health').reply(403, { message: 'Forbidden' })

      await expect(apiClient.get('/health')).rejects.toThrow()

      expect(authorizationTokenRefreshMock).not.toHaveBeenCalled()
      expect(server.isDone()).to.be.true
    })

    it('should not refresh on 500', async () => {
      authorizationTokenGeneratorMock.mockResolvedValue({
        'Proxy-auth': 'Bearer 123',
      })

      server.get('/health').reply(500, { message: 'Internal Server Error' })

      await expect(apiClient.get('/health')).rejects.toThrow()

      expect(authorizationTokenRefreshMock).not.toHaveBeenCalled()
      expect(server.isDone()).to.be.true
    })
  })

  describe('error propagation', () => {
    it('should propagate error when authorizationTokenRefresh throws', async () => {
      const refreshError = new Error('refresh failed')
      const throwingRefreshMock = vi.fn().mockRejectedValue(refreshError)

      const apiClient = TypedClient<ApiClient>(url, {
        authorizationTokenGenerator: authorizationTokenGeneratorMock,
        authorizationTokenRefresh: throwingRefreshMock,
      })

      authorizationTokenGeneratorMock.mockResolvedValue({
        'Proxy-auth': 'Bearer 123',
      })

      server.get('/health').reply(401, { message: 'Unauthorized' })

      await expect(apiClient.get('/health')).rejects.toThrow()

      expect(throwingRefreshMock).toHaveBeenCalledOnce()
    })

    it('should propagate error when authorizationTokenGenerator throws', async () => {
      const generatorError = new Error('generator failed')
      const throwingGeneratorMock = vi.fn().mockRejectedValue(generatorError)

      const apiClient = TypedClient<ApiClient>(url, {
        authorizationTokenGenerator: throwingGeneratorMock,
        authorizationTokenRefresh: authorizationTokenRefreshMock,
      })

      await expect(apiClient.get('/health')).rejects.toThrow('generator failed')
    })
  })

  describe('token headers are sent on retry', () => {
    it('should attach refreshed token headers to the retried request', async () => {
      const refreshedToken = 'Bearer refreshed-token'

      authorizationTokenGeneratorMock.mockResolvedValueOnce({
        Authorization: 'Bearer expired-token',
      })
      authorizationTokenGeneratorMock.mockResolvedValueOnce({
        Authorization: refreshedToken,
      })
      authorizationTokenRefreshMock.mockResolvedValue(undefined)

      const apiClient = TypedClient<ApiClient>(url, {
        authorizationTokenGenerator: authorizationTokenGeneratorMock,
        authorizationTokenRefresh: authorizationTokenRefreshMock,
      })

      server
        .get('/health')
        .matchHeader('authorization', 'Bearer expired-token')
        .reply(401, { message: 'Unauthorized' })
        .get('/health')
        .matchHeader('authorization', refreshedToken)
        .reply(200, {})

      await apiClient.get('/health')

      expect(server.isDone()).to.be.true
    })
  })
})
