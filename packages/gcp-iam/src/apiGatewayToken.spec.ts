import { IAMCredentialsClient } from '@google-cloud/iam-credentials'
import { type Mock, beforeAll, describe, expect, it, vi } from 'vitest'
import type { Logger } from 'winston'
import { getApiGatewayToken } from './apiGatewayToken'

vi.mock('@google-cloud/iam-credentials', () => ({
  IAMCredentialsClient: vi.fn().mockReturnValue({
    signBlob: vi.fn().mockResolvedValue(['test-signed-jwt']),
  }),
}))

vi.mock('google-auth-library', () => ({
  GoogleAuth: vi.fn().mockReturnValue({
    getCredentials: vi
      .fn()
      .mockResolvedValue({ client_email: 'some@place.eu' }),
  }),
}))

describe('Google IAM', () => {
  describe('getApiGatewayToken', () => {
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

      const JWT = await getApiGatewayToken({ apiURL: 'test-audience' })

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

      const originalJWT = await getApiGatewayToken({
        apiURL: 'test-audience-double',
      })

      const cachedJWT = await getApiGatewayToken({
        apiURL: 'test-audience-double',
      })

      expect(originalJWT).equal(cachedJWT)

      expect(signBlobMock).toHaveBeenCalledOnce()
    })

    it('should log errors if passed a logger', async () => {
      signBlobMock.mockRejectedValueOnce(new Error('test-error'))
      const loggerMock = {
        error: vi.fn(),
      }

      try {
        await getApiGatewayToken({
          apiURL: 'test-audience-error',
          logger: loggerMock as unknown as Logger,
        })
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }

      expect(loggerMock.error).toHaveBeenCalled()
    })

    it('should return an empty string if GCP_IAM_SOFT_FAIL is true', async () => {
      signBlobMock.mockRejectedValueOnce(new Error('test-error'))
      process.env.GCP_IAM_SOFT_FAIL = 'true'

      const JWT = await getApiGatewayToken({
        apiURL: 'test-audience-soft-fail',
      })

      expect(JWT).toBe('')

      // biome-ignore lint/performance/noDelete: This is a test :o)
      delete process.env.GCP_IAM_SOFT_FAIL
    })
  })
})
