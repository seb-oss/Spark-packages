import type { BrunoRequest } from '@usebruno/lang'
import { jsonSerialize } from '../serialize'
import { generateBody } from './generate-body'
import { generateParams } from './generate-params'
import { generateUrl } from './generate-url'

export const generateArgs = (req: BrunoRequest) => {
  // URL (with query string if params exist)
  const urlWithQs = generateUrl(req)

  // Base args: method + url
  const args: string[] = [
    `'${req.http.method?.toUpperCase()}'`,
    `parse.url(${jsonSerialize(urlWithQs)})`,
  ]

  // Body (raw only for now, via helper)
  const bodyArg = generateBody(req)
  if (bodyArg) {
    args.push(`parse.body(${bodyArg})`)
  }

  const paramsObj = generateParams(req)

  // Emit params if any
  if (Object.keys(paramsObj).length > 0) {
    // keep k6 arg positions: add undefined if no body was emitted
    if (bodyArg === undefined) {
      args.push('undefined')
    }
    args.push(`parse.params(${jsonSerialize(paramsObj)})`)
  }

  return args
}
