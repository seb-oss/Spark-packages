import type { Request } from 'express'
import type { Entity, Link } from './types'
import { resolveUrl } from './url'

const normaliseLinks = (
  links: Record<string, string | Link>
): Record<string, Link> => {
  const result: Record<string, Link> = {}
  for (const [name, link] of Object.entries(links)) {
    result[name] =
      typeof link === 'string' ? { method: 'GET', href: link } : link
  }
  return result
}

export const toEntity = <T>(
  req: Request,
  data: T,
  links: Record<string, string | Link> = {}
): Entity<T> => {
  const resolvedLinks: Record<string, Link> = {}
  for (const [name, { method, href }] of Object.entries(
    normaliseLinks(links)
  )) {
    resolvedLinks[name] = { method, href: resolveUrl(req, href) }
  }

  return {
    data,
    links: {
      ...resolvedLinks,
      self: { method: 'GET', href: resolveUrl(req) },
    },
  }
}
