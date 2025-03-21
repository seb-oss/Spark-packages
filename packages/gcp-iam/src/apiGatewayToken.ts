import { IAMCredentialsClient } from '@google-cloud/iam-credentials'
import { GoogleAuth } from 'google-auth-library'
import type { Logger } from 'winston'
import { LruCache } from './lruCache'

const expInSeconds = 60 * 60
// TODO: Make ttl changeable from getApiGatewayToken function
const apiGatewayJwtCache = new LruCache<Promise<string>>()

const generateTokenByUrl = async ({
  apiURL,
  key,
  logger,
}: {
  apiURL: string
  key?: string
  logger?: Logger
}) => {
  try {
    const iamClient = new IAMCredentialsClient()
    const auth = new GoogleAuth()
    const cred = await auth.getCredentials()
    const serviceAccountEmail = cred.client_email

    if (!serviceAccountEmail) {
      throw new Error('No service account e-mail could be found.')
    }

    // Remove when verified
    logger?.info(`Service account e-mail being used: ${serviceAccountEmail}`)

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

    // Debug.
    logger?.debug(
      `New JWT for ${key || apiURL} created. Signed with ${response.keyId}.`
    )

    // Encode the binary signature to Base64.
    const signature = Buffer.from(response.signedBlob).toString('base64')

    // Combine into the final JWT.
    const signedJWT = `${unsignedJWT}.${signature}`

    return signedJWT
  } catch (error) {
    if (process.env.GCP_IAM_SOFT_FAIL === 'true') {
      logger?.info('Soft fail enabled, returning empty JWT')
      return ''
    }

    logger?.error('Error generating system JWT', error)

    throw new Error(`Error generating system JWT: ${JSON.stringify(error)}`)
  }
}

/**
 * Generate a system token for the API Gateway.
 * This is intended to be run under the context of the service account signing the JWT.
 * @param apiUrl The URL of the API Gateway including the path of the specific API to be accessed using the token.
 * @param serviceAccountEmail The email of the service account to be used.
 * @param logger An optional logger to use for logging.
 * @returns A JWT.
 */
export const getApiGatewayTokenByUrl = async ({
  apiURL,
  key,
  logger,
}: {
  apiURL: string
  key?: string
  logger?: Logger
}): Promise<string> => {
  return checkCache({
    cacheKey: key || apiURL,
    generate: () => generateTokenByUrl({ apiURL, key, logger }),
    logger,
  })
}

/**
 *
 * @param key Clears a cached JWT by key.
 */
export const clearCache = async (key: string) => {
  apiGatewayJwtCache.clear(key)
}

const checkCache = ({
  cacheKey,
  generate,
  logger,
}: { cacheKey: string; generate: () => Promise<string>; logger?: Logger }) => {
  /**
   * Check if there is a cached JWT
   */

  const cachedJwt = apiGatewayJwtCache.get(cacheKey)
  if (cachedJwt) {
    logger?.debug(`JWT for ${cacheKey} found in cache.`)
    return cachedJwt
  }

  const jwtPromise = generate()

  // cache generated jwt
  apiGatewayJwtCache.put(cacheKey, jwtPromise, expInSeconds / 2 * 1000)

  return jwtPromise
}

const generateTokenByClientId = async (clientId: string, logger?: Logger) => {
  try {
    const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    })
    const client = await auth.getIdTokenClient(clientId)

    return await client.idTokenProvider.fetchIdToken(clientId)
  } catch (error) {
    if (process.env.GCP_IAM_SOFT_FAIL === 'true') {
      logger?.info('Soft fail enabled, returning empty JWT.')
      return ''
    }

    logger?.error('Error generating system JWT', error)
    logger?.error(JSON.stringify(error, null, 2))

    throw new Error(`Error generating system JWT: ${JSON.stringify(error)}`)
  }
}

/**
 * Generates a JWT for the API Gateway, using Client ID as audience.
 * @param clientId OAUTH Client ID.
 * @returns ID Token.
 */
export const getApiGatewayTokenByClientId = async (
  clientId: string,
  logger?: Logger
): Promise<string> => {
  return checkCache({
    cacheKey: clientId,
    generate: () => generateTokenByClientId(clientId),
    logger,
  })
}
