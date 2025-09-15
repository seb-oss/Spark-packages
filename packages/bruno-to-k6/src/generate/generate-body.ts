import type { BrunoBody, BrunoRequest } from '@usebruno/lang'
import { escapeString, jsonSerialize } from '../serialize'
import { isBlank, isParsedEmptyObject } from '../utils'

export const generateBody = (req: BrunoRequest) => {
  switch (req.http.body) {
    case 'graphql': {
      return generateGraphQlBody(req.body as BrunoBody)
    }

    case 'formUrlEncoded': {
      return generateFormBody(req.body as BrunoBody)
    }

    case 'multipartForm': {
      return generateMultipartBody(req.body as BrunoBody)
    }

    // Raw buckets: normalized 'raw' or UI flavors ('json', 'text', 'xml', 'sparql')
    case 'json':
    case 'text':
    case 'xml':
    case 'sparql': {
      return generateRawBody(req.body as BrunoBody)
    }

    // Unknown/unsupported → no body
    case 'none':
    case undefined:
    default: {
      return undefined
    }
  }
}

const generateRawBody = (body: BrunoBody) => {
  // JSON can come as a string OR an already-parsed object
  if (body.json != null) {
    if (typeof body.json === 'string') {
      try {
        const obj = JSON.parse(body.json)
        return jsonSerialize(obj)
      } catch {
        // keep as raw string if not valid JSON
        return jsonSerialize(body.json)
      }
    }
    // already an object/array/primitive → just serialize
    return jsonSerialize(body.json as unknown)
  }

  // Other raw kinds
  if (typeof body.text === 'string') return jsonSerialize(body.text)
  if (typeof body.xml === 'string') return jsonSerialize(body.xml)
  if (typeof body.sparql === 'string') return jsonSerialize(body.sparql)

  return undefined
}

const generateFormBody = (body: BrunoBody) => {
  const fields: Record<string, unknown> = {}
  for (const f of body.formUrlEncoded || []) {
    if (!f?.name || f.enabled === false) continue
    fields[f.name] = f.value ?? ''
  }
  return jsonSerialize(fields)
}

const generateMultipartBody = (body: BrunoBody) => {
  const fields: Record<string, unknown> = {}
  for (const f of body.multipartForm || []) {
    if (!f?.name || f.enabled === false) continue
    const v = f.value ?? ''
    if (typeof v === 'string') {
      const t = v.trim()
      // Heuristic: coerce simple "{'k':'v'}" into an object
      if (t.startsWith('{') && t.endsWith('}') && t.includes(':')) {
        try {
          const asJson = t.replace(/'/g, '"')
          fields[f.name] = JSON.parse(asJson)
          continue
        } catch {
          // keep as-is
        }
      }
    }
    fields[f.name] = v
  }
  return jsonSerialize(fields)
}

const generateGraphQlBody = (body: BrunoBody) => {
  const query = body.graphql?.query ?? ''
  const variables = body.graphql?.variables

  let out = `{query: '${escapeString(query)}'`
  if (
    typeof variables === 'string' &&
    !isBlank(variables) &&
    !isParsedEmptyObject(variables)
  ) {
    out += `, variables: '${escapeString(variables)}'`
  }
  out += `}`
  return out
}
