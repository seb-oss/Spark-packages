import type { Request } from 'express'
import type { Entity, Link } from './types'

export const entity = <T>(
  req: Request,
  data: T,
  hypermedia: Record<string, Link>
): Entity<T> => {
  const host =
    req.get('x-forwarded-host')?.split(',')[0].trim() ?? req.get('host')
  const prefix = req.get('x-forwarded-prefix') ?? ''
  const url = req.originalUrl

  const base = `//${host}${prefix}`

  const links: Record<string, Link> = {
    self: { method: 'GET', href: resolveUrl(base, url) },
  }
  for (const [name, { method, href }] of Object.entries(hypermedia)) {
    links[name] = { method, href: resolveUrl(base, href) }
  }

  return {
    data,
    links,
  }
}

const resolveUrl = (base: string, url: string): string => {
  return `${base}${url}`
}
