import { IAMCredentialsClient } from '@google-cloud/iam-credentials'
import { beforeAll, describe, expect, it, type Mock, vi } from 'vitest'
import {
  clearCache,
  getApiGatewayTokenByClientId,
  getApiGatewayTokenByUrl,
} from './apiGatewayToken'

const fetchIdToken = vi.hoisted(() =>
  vi.fn().mockResolvedValue('mock-id-token')
)

const getCredentials = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ client_email: 'some@place.eu' })
)

vi.mock('@google-cloud/iam-credentials', () => {
  const signBlob = vi.fn().mockResolvedValue(['test-signed-jwt'])

  class IAMCredentialsClient {
    signBlob = signBlob
  }

  return { IAMCredentialsClient }
})

vi.mock('google-auth-library', () => {
  class GoogleAuth {
    getCredentials = getCredentials
    getIdTokenClient = vi.fn().mockResolvedValue({
      idTokenProvider: { fetchIdToken },
    })
  }

  return { GoogleAuth }
})

describe('Google IAM', () => {
  describe('getApiGatewayTokenByUrl', () => {
    let signBlobMock: Mock

    const iamClientMock = new IAMCredentialsClient()

    beforeAll(() => {
      vi.useFakeTimers().setSystemTime(new Date(Date.UTC(2024, 8, 30, 13, 37)))
      signBlobMock = iamClientMock.signBlob as Mock
    })

    it('should return a signed JWT', async () => {
      signBlobMock.mockResolvedValueOnce([
        {
          signedBlob: Buffer.from('test-signed-jwt'),
        },
      ])

      const JWT = await getApiGatewayTokenByUrl({ apiURL: 'test-audience' })

      expect(JWT).toMatchSnapshot()

      expect(signBlobMock).toHaveBeenCalled()
      expect(signBlobMock).toHaveBeenCalledWith({
        delegates: ['some@place.eu'],
        name: 'projects/-/serviceAccounts/some@place.eu',
        payload: expect.any(Uint8Array),
      })
    })
    it('when called with the same URI it should only sign once', async () => {
      signBlobMock.mockResolvedValueOnce([
        {
          signedBlob: Buffer.from('test-signed-jwt'),
        },
      ])

      signBlobMock.mockClear()

      const originalJWT = await getApiGatewayTokenByUrl({
        apiURL: 'test-audience-double',
      })

      const cachedJWT = await getApiGatewayTokenByUrl({
        apiURL: 'test-audience-double',
      })

      expect(originalJWT).equal(cachedJWT)

      expect(signBlobMock).toHaveBeenCalledOnce()
    })

    it('should log errors if passed a logger', async () => {
      signBlobMock.mockRejectedValueOnce(new Error('test-error'))

      await expect(() =>
        getApiGatewayTokenByUrl({
          apiURL: 'test-audience-error',
        })
      ).rejects.toThrow()
    })

    it('should return an empty string if GCP_IAM_SOFT_FAIL is true', async () => {
      signBlobMock.mockRejectedValueOnce(new Error('test-error'))
      process.env.GCP_IAM_SOFT_FAIL = 'true'

      const JWT = await getApiGatewayTokenByUrl({
        apiURL: 'test-audience-soft-fail',
      })

      expect(JWT).toBe('')

      // biome-ignore lint/performance/noDelete: This is a test :o)
      delete process.env.GCP_IAM_SOFT_FAIL
    })

    it('throws when service account email is missing', async () => {
      getCredentials.mockResolvedValueOnce({ client_email: undefined })

      await expect(
        getApiGatewayTokenByUrl({ apiURL: 'test-audience-no-email' })
      ).rejects.toThrow('Error generating system JWT')
    })

    it('throws when signBlob returns empty signedBlob', async () => {
      signBlobMock.mockResolvedValueOnce([{ signedBlob: null }])

      await expect(
        getApiGatewayTokenByUrl({ apiURL: 'test-audience-empty-blob' })
      ).rejects.toThrow('Error generating system JWT')
    })

    it('clears a cached entry so next call re-generates', async () => {
      signBlobMock.mockResolvedValueOnce([{ signedBlob: Buffer.from('jwt') }])

      const url = 'test-audience-clear'
      await getApiGatewayTokenByUrl({ apiURL: url })
      await clearCache(url)

      signBlobMock.mockClear()
      signBlobMock.mockResolvedValueOnce([{ signedBlob: Buffer.from('jwt2') }])
      await getApiGatewayTokenByUrl({ apiURL: url })
      expect(signBlobMock).toHaveBeenCalledOnce()
    })
  })

  describe('getApiGatewayTokenByClientId', () => {
    it('returns an id token', async () => {
      const token = await getApiGatewayTokenByClientId('test-client-id')
      expect(token).toBe('mock-id-token')
    })

    it('throws on error when GCP_IAM_SOFT_FAIL is not set', async () => {
      vi.mocked(fetchIdToken).mockRejectedValueOnce(new Error('fetch failed'))

      await expect(
        getApiGatewayTokenByClientId('error-client-id')
      ).rejects.toThrow('Error generating system JWT')
    })

    it('returns empty string on error when GCP_IAM_SOFT_FAIL is true', async () => {
      vi.mocked(fetchIdToken).mockRejectedValueOnce(new Error('fetch failed'))
      process.env.GCP_IAM_SOFT_FAIL = 'true'

      const token = await getApiGatewayTokenByClientId('soft-fail-client-id')
      expect(token).toBe('')

      // biome-ignore lint/performance/noDelete: This is a test :o)
      delete process.env.GCP_IAM_SOFT_FAIL
    })
  })
})
