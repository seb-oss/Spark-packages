import { IAMCredentialsClient } from '@google-cloud/iam-credentials'
import { type Mock, beforeAll, describe, expect, it, vi } from 'vitest'
import type { Logger } from 'winston'
import { getApiGatewayToken } from './apiGatewayToken'

vi.mock('@google-cloud/iam-credentials', () => ({
  IAMCredentialsClient: vi.fn().mockReturnValue({
    signBlob: vi.fn().mockResolvedValue(['test-signed-jwt']),
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

      const JWT = await getApiGatewayToken(
        'test-audience',
        'test-service-account-email'
      )

      expect(JWT).toMatchSnapshot()

      expect(signBlobMock).toHaveBeenCalled()
      expect(signBlobMock).toHaveBeenCalledWith({
        delegates: ['test-service-account-email'],
        name: 'projects/-/serviceAccounts/test-service-account-email',
        payload: expect.any(Buffer),
      })
    })
    it('when called with the same URI it should only sign once', async () => {
      signBlobMock.mockResolvedValueOnce([
        {
          signedBlob: Buffer.from('test-signed-jwt'),
        },
      ])

      signBlobMock.mockClear()

      const originalJWT = await getApiGatewayToken(
        'test-audience-double',
        'test-service-account-email-double'
      )

      const cachedJWT = await getApiGatewayToken(
        'test-audience-double',
        'test-service-account-email-double'
      )

      expect(originalJWT).equal(cachedJWT)

      expect(signBlobMock).toHaveBeenCalledOnce()
    })

    it('should log errors if passed a logger', async () => {
      signBlobMock.mockRejectedValueOnce(new Error('test-error'))
      const loggerMock = {
        error: vi.fn(),
      }

      try {
        await getApiGatewayToken(
          'test-audience-error',
          'test-service-account-email-error',
          loggerMock as unknown as Logger
        )
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }

      expect(loggerMock.error).toHaveBeenCalled()
    })
  })
})
