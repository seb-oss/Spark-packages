import type { Request } from 'express'

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

  // fallback: treat as ./foo
  return `${prefix}${originalUrl}/${url}`
}

const resolveParent = (base: string, url: string): string => {
  const parts = base.split('/').filter(Boolean)
  let remaining = url

  while (remaining.startsWith('../')) {
    if (parts.length > 0) parts.pop()
    remaining = remaining.slice(3)
  }

  return `/${parts.join('/')}${parts.length > 0 ? '/' : ''}${remaining}`
}
