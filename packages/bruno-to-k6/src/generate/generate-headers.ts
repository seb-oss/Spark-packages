import type { BrunoRequest } from '@usebruno/lang'

export const generateHeaders = (
  req: BrunoRequest
): Record<string, string> | undefined => {
  const headers: Record<string, string> = {}

  // explicit headers (skip disabled) — Bruno uses name/value/enabled
  for (const h of req.headers ?? []) {
    if (!h?.name || h.enabled === false) continue
    headers[h.name] = h.value ?? ''
  }

  // auth → headers (don’t overwrite explicit)
  if (!headers['Authorization']) {
    // Bearer
    if (req.auth?.bearer?.token) {
      headers['Authorization'] = `Bearer ${req.auth.bearer.token}`
    }
    // Basic
    else if (
      req.auth?.basic?.username != null ||
      req.auth?.basic?.password != null
    ) {
      const u = (req.auth.basic?.username ?? '').replace(/'/g, "\\'")
      const p = (req.auth.basic?.password ?? '').replace(/'/g, "\\'")
      headers['Authorization'] = `Basic ${Buffer.from(`${u}:${p}`).toString(
        'base64'
      )}`
    }
    // Digest
    else if (req.auth?.digest) {
      const u = (req.auth.digest.username ?? '').replace(/'/g, "\\'")
      const p = (req.auth.digest.password ?? '').replace(/'/g, "\\'")
      headers['Authorization'] = `Digest \${bru.digestAuth(ENV,'${u}','${p}')}`
    }
    // OAuth2 (token in header, with prefix)
    else if (req.auth?.oauth2?.tokenPlacement === 'header') {
      const prefix = req.auth.oauth2.tokenHeaderPrefix || 'Bearer'
      const credId = (req.auth.oauth2.credentialsId || '').replace(/'/g, "\\'")
      // Use template literal to keep the interpolation braces in output
      headers['Authorization'] =
        `${prefix} \${bru.oauth2Token(ENV,'${credId}')}`
    }
  }

  // API key (header placement), only if not explicitly provided
  if (req.auth?.apikey?.key && req.auth.apikey.placement === 'header') {
    const k = req.auth.apikey.key
    if (!headers[k]) {
      headers[k] = req.auth.apikey.value ?? ''
    }
  }

  // content-type for bodies (Bruno)
  if (!headers['Content-Type']) {
    if (req.http.body === 'graphql') {
      headers['Content-Type'] = 'application/json'
    } else if (req.http.body === 'json' && typeof req.body?.json === 'string') {
      headers['Content-Type'] = 'application/json'
    } else if (
      req.http.body === 'formUrlEncoded' &&
      Array.isArray(req.body?.formUrlEncoded)
    ) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded'
    }
    // note: multipart → no auto Content-Type
  }

  return Object.keys(headers).length ? headers : undefined
}
