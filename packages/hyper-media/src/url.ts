import type { Request } from 'express'

/**
 * Constructs a public-facing URL from the request context.
 *
 * Uses forwarded headers to build the correct public URL across proxy hops:
 * - `X-Forwarded-Host` — public hostname set by eg. Kong
 * - `X-Forwarded-Prefix` — path prefix accumulated across ALB hops
 *
 * When called without a url argument, returns the full self URL including
 * any query string. When called with a url argument, resolves it relative
 * to the request context:
 * - `/foo` — appended to the prefix only, ignoring the current path
 * - `./foo` — appended to prefix + current path
 * - `../foo` — walks up from prefix + current path
 * - `foo` — treated as `./foo`
 *
 * All URLs use implicit protocol (`//host/path`) so the client inherits
 * the protocol from its own context.
 *
 * @param req - The Express request.
 * @param url - Optional URL to resolve. Omit to get the self URL.
 * @returns A protocol-relative public-facing URL.
 *
 * @example
 * resolveUrl(req)                // //api.example.com/trading/v1/orders?status=active
 * resolveUrl(req, '/health')     // //api.example.com/trading/v1/health
 * resolveUrl(req, './detail')    // //api.example.com/trading/v1/orders/detail
 * resolveUrl(req, '../ping')     // //api.example.com/trading/v1/ping
 */
export const resolveUrl = (req: Request, url?: string): string => {
  const host =
    req.get('x-forwarded-host')?.split(',')[0].trim() ?? req.get('host') ?? ''

  const prefix = (req.get('x-forwarded-prefix') ?? '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .join('')

  const originalUrl = req.originalUrl
  const originalPath = originalUrl.split('?')[0].replace(/\/$/, '')
  const query = originalUrl.includes('?') ? `?${originalUrl.split('?')[1]}` : ''

  if (!url) {
    return `//${host}${prefix}${originalPath}${query}`
  }

  const resolved = resolveSegment(prefix, originalPath, url)
  return `//${host}${resolved}`
}

/**
 * Resolves a URL segment relative to the current prefix and path.
 *
 * @param prefix - The accumulated path prefix from X-Forwarded-Prefix.
 * @param originalUrl - The current request path, without query string.
 * @param url - The URL to resolve.
 * @returns A resolved absolute path.
 */
const resolveSegment = (
  prefix: string,
  originalUrl: string,
  url: string
): string => {
  if (url.startsWith('/')) {
    // /foo → prefix + /foo
    return `${prefix}${url}`
  }

  if (url.startsWith('./')) {
    // ./foo → prefix + originalUrl + /foo
    return `${prefix}${originalUrl}/${url.slice(2)}`
  }

  if (url.startsWith('../')) {
    // ../foo → walk up from prefix + originalUrl
    return resolveParent(`${prefix}${originalUrl}`, url)
  }

  // Bare string treated as ./foo
  return `${prefix}${originalUrl}/${url}`
}

/**
 * Walks up the path hierarchy for each `../` segment, stopping at root.
 *
 * @param base - The full base path to walk up from.
 * @param url - The `../`-prefixed URL to resolve.
 * @returns A resolved absolute path.
 */
const resolveParent = (base: string, url: string): string => {
  const parts = base.split('/').filter(Boolean)
  let remaining = url

  while (remaining.startsWith('../')) {
    if (parts.length > 0) parts.pop()
    remaining = remaining.slice(3)
  }

  return `/${parts.join('/')}${parts.length > 0 ? '/' : ''}${remaining}`
}
