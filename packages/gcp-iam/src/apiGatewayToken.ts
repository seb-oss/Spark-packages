import { IAMCredentialsClient } from '@google-cloud/iam-credentials'
import { GoogleAuth } from 'google-auth-library'
import type { Logger } from 'winston'
import { LruCache } from './lruCache'

const expInSeconds = 60 * 60
const apiGatewayJwtCache = new LruCache<string>({
  ttl: (1000 * expInSeconds) / 2,
})
/**
 * Generate a system token for the API Gateway.
 * This is intended to be run under the context of the service account signing the JWT.
 * @param apiUrl The URL of the API Gateway including the path of the specific API to be accessed using the token.
 * @param serviceAccountEmail The email of the service account to be used.
 * @param logger An optional logger to use for logging.
 * @returns A JWT.
 */
export const getApiGatewayToken = async (
  apiURL: string,
  logger?: Logger
): Promise<string> => {
  /**
   * Check if there is a cached JWT
   */

  const cachedJwt = apiGatewayJwtCache.get(apiURL)
  console.log(cachedJwt)
  if (cachedJwt) {
    return cachedJwt
  }

  try {
    const iamClient = new IAMCredentialsClient()

    const auth = new GoogleAuth()
    const cred = await auth.getCredentials()
    const serviceAccountEmail = cred.client_email

    if (!serviceAccountEmail) {
      throw new Error('No service account e-mail could be found.')
    }

    // Remove when verified
    logger?.info(`Serice account e-mail beeing used: ${serviceAccountEmail}`)

    /**
     * JWT Header.
     */

    const header = {
      alg: 'RS256',
      typ: 'JWT',
    }
    const headerBase64 = Buffer.from(JSON.stringify(header)).toString('base64')

    /**
     * JWT Payload.
     */

    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iss: serviceAccountEmail,
      sub: serviceAccountEmail,
      aud: apiURL,
      iat: now,
      exp: now + expInSeconds,
    }

    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString(
      'base64'
    )

    /**
     * JWT Signature.
     */

    const unsignedJWT = `${headerBase64}.${payloadBase64}`
    const [response] = await iamClient.signBlob({
      delegates: [serviceAccountEmail],
      name: `projects/-/serviceAccounts/${serviceAccountEmail}`,
      payload: new Uint8Array(Buffer.from(unsignedJWT)),
    })

    if (!response.signedBlob) {
      throw new Error(
        'signBlob(...) returned an empty response. Cannot sign JWT.'
      )
    }

    // Encode the binary signature to Base64.
    const signature = Buffer.from(response.signedBlob).toString('base64')

    // Combine into the final JWT.
    const signedJWT = `${unsignedJWT}.${signature}`

    // cache generated jwt
    apiGatewayJwtCache.put(apiURL, signedJWT)
    return signedJWT
  } catch (error) {
    if (logger) {
      logger.error('Error generating system JWT', error)
    }

    throw new Error('Error generating system JWT')
  }
}
