import type { Request } from 'express'
import type { Entity, Link } from './types'
import { resolveUrl } from './url'

/**
 * Normalises a mixed link record by converting string shorthands to full
 * {@link Link} objects with a default GET method.
 *
 * @param links - A record of links, either as strings or full {@link Link} objects.
 * @returns A record of full {@link Link} objects.
 */
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

/**
 * Wraps data in a hypermedia entity envelope with a self link and any
 * additional resolved links.
 *
 * The self link is always derived from the request and cannot be overridden.
 * All link hrefs are resolved against the public-facing URL constructed from
 * forwarded headers.
 *
 * String links are treated as GET requests:
 * ```
 * { parent: '/orders' }
 * // is equivalent to
 * { parent: { method: 'GET', href: '/orders' } }
 * ```
 *
 * @param req - The Express request, used to construct public-facing URLs.
 * @param data - The data to wrap.
 * @param links - Optional record of links, either as strings or full {@link Link} objects.
 * @returns An {@link Entity} with resolved links and a self link.
 *
 * @example
 * const entity = toEntity(req, order, {
 *   parent: '/orders',
 *   cancel: { method: 'DELETE', href: './cancel', title: 'Cancel order' },
 * })
 */
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
