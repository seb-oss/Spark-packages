import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@sebspark/gcp-iam', () => ({
  getApiGatewayTokenByUrl: vi.fn(),
  getApiGatewayTokenByClientId: vi.fn(),
  clearCache: vi.fn(),
}))

import {
  clearCache,
  getApiGatewayTokenByClientId,
  getApiGatewayTokenByUrl,
} from '@sebspark/gcp-iam'
import {
  apiGatewayTokenByClientIdGenerator,
  apiGatewayTokenByUrlGenerator,
  apiGatewayTokenRefresh,
} from './index'

const mockGetByUrl = vi.mocked(getApiGatewayTokenByUrl)
const mockGetByClientId = vi.mocked(getApiGatewayTokenByClientId)
const mockClearCache = vi.mocked(clearCache)

describe('apiGatewayTokenByUrlGenerator', () => {
  beforeEach(() => {
    delete process.env.ENV
  })
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns x-api-key only in local env', async () => {
    process.env.ENV = 'local'
    const fn = apiGatewayTokenByUrlGenerator('my-key')
    const result = await fn('https://api.example.com')
    expect(result).toEqual({ 'x-api-key': 'my-key' })
    expect(mockGetByUrl).not.toHaveBeenCalled()
  })

  it('returns Proxy-Authorization and x-api-key in non-local env', async () => {
    mockGetByUrl.mockResolvedValue('token-abc')
    const fn = apiGatewayTokenByUrlGenerator('my-key')
    const result = await fn('https://api.example.com')
    expect(mockGetByUrl).toHaveBeenCalledWith({
      apiURL: 'https://api.example.com',
    })
    expect(result).toEqual({
      'Proxy-Authorization': 'Bearer token-abc',
      'x-api-key': 'my-key',
    })
  })
})

describe('apiGatewayTokenByClientIdGenerator', () => {
  beforeEach(() => {
    delete process.env.ENV
  })
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns x-api-key only in local env', async () => {
    process.env.ENV = 'local'
    const fn = apiGatewayTokenByClientIdGenerator('my-key', 'client-123')
    const result = await fn()
    expect(result).toEqual({ 'x-api-key': 'my-key' })
    expect(mockGetByClientId).not.toHaveBeenCalled()
  })

  it('returns Proxy-Authorization and x-api-key in non-local env', async () => {
    mockGetByClientId.mockResolvedValue('token-xyz')
    const fn = apiGatewayTokenByClientIdGenerator('my-key', 'client-123')
    const result = await fn()
    expect(mockGetByClientId).toHaveBeenCalledWith('client-123')
    expect(result).toEqual({
      'Proxy-Authorization': 'Bearer token-xyz',
      'x-api-key': 'my-key',
    })
  })
})

describe('apiGatewayTokenRefresh', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('calls clearCache with the url', async () => {
    mockClearCache.mockResolvedValue(undefined)
    const fn = apiGatewayTokenRefresh()
    await fn('https://api.example.com')
    expect(mockClearCache).toHaveBeenCalledWith('https://api.example.com')
  })
})
