import {
  type BrunoFolder,
  type BrunoRequest,
  bruToEnvJsonV2,
  bruToJsonV2,
  collectionBruToJson,
} from '@usebruno/lang'

/**
 * Parse a raw request .bru source string into a BrunoRequest.
 *
 * Ensures `meta.seq` is always a number for consistent sorting.
 *
 * @param src - Raw text content of a request .bru file
 * @returns Parsed BrunoRequest object
 */
export const parseRequest = (src: string) => {
  const req = bruToJsonV2(src)
  return {
    ...req,
    meta: {
      ...req.meta,
      seq: Number(req.meta.seq),
    },
  } as BrunoRequest
}

/**
 * Parse a raw environment .bru source string into a BrunoEnvironment object.
 *
 * @param src - Raw text content of an environment .bru file
 * @returns Parsed BrunoEnvironment object
 */
export const parseEnv = (src: string) => bruToEnvJsonV2(src)

/**
 * Parse a raw folder .bru source string into a BrunoFolder.
 *
 * Ensures `meta.seq` is always a number and sets the meta type to `"folder"`.
 *
 * @param src - Raw text content of a folder.bru file
 * @returns Parsed BrunoFolder object
 */
export const parseFolder = (src: string): BrunoFolder => {
  const asReq = collectionBruToJson(src)

  return {
    meta: {
      type: 'folder',
      name: asReq.meta.name,
      seq: Number(asReq.meta.seq),
    },
    auth: asReq.auth!,
  } as BrunoFolder
}
