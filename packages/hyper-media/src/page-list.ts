import type { Request } from 'express'
import type { Entity, Link, PageListEntity } from './types'
import { resolveUrl } from './url'

/**
 * Wraps a pre-mapped list of entities in a page-based pagination envelope.
 *
 * prev is absent on the first page, next is absent on the last page.
 * All existing query params such as filters are preserved and merged with
 * pagination params.
 *
 * @param req - The Express request, used to construct public-facing URLs.
 * @param data - Pre-mapped entities, each wrapped with {@link toEntity}.
 * @param page - Current page number (1-based).
 * @param pageSize - Number of items per page.
 * @param total - Total number of items across all pages.
 * @returns A {@link PageListEntity} with self, first, last, and optional prev/next links.
 *
 * @example
 * const entity = toPageListEntity(
 *   req,
 *   orders.map((o) => toEntity(req, o, { self: `./orders/${o.id}` })),
 *   page,
 *   pageSize,
 *   total
 * )
 */
export const toPageListEntity = <T, E extends Entity<T>>(
  req: Request,
  data: E[],
  page: number,
  pageSize: number,
  total: number
): PageListEntity<T> => {
  const lastPage = Math.ceil(total / pageSize)

  const buildLink = (p: number): Link => ({
    method: 'GET',
    href: resolveUrl(req, buildPageUrl(req, p, pageSize)),
  })

  return {
    data,
    _meta: { page, pageSize, total },
    links: {
      self: { method: 'GET', href: resolveUrl(req) },
      first: buildLink(1),
      last: buildLink(lastPage),
      ...(page > 1 && { prev: buildLink(page - 1) }),
      ...(page < lastPage && { next: buildLink(page + 1) }),
    },
  }
}

/**
 * Builds a page navigation URL by merging the page and page size into the
 * current request's query params, preserving any existing params such as filters.
 *
 * @param req - The Express request.
 * @param page - The page number to navigate to.
 * @param pageSize - Number of items per page.
 * @returns A path-relative URL with page and page_size query params merged in.
 */
const buildPageUrl = (req: Request, page: number, pageSize: number): string => {
  const [path, queryString] = req.originalUrl.split('?')
  const params = new URLSearchParams(queryString)
  params.set('page', String(page))
  params.set('page_size', String(pageSize))
  return `${path}?${params.toString()}`
}
