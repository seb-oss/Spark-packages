import type { BrunoRequest } from '@usebruno/lang'
import { generateHeaders } from './generate-headers'

export const generateParams = (req: BrunoRequest) => {
  // Params object (form fields + headers)
  const paramsObj: Record<string, unknown> = {}

  // headers (explicit + auth + content-type) via helper
  const headers = generateHeaders(req)
  if (headers) {
    paramsObj.headers = headers
  }

  return paramsObj
}
