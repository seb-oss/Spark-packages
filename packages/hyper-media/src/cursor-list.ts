import type { Request } from 'express'
import type { CursorListEntity, CursorMeta, Entity, Link } from './types'
import { resolveUrl } from './url'

/**
 * Builds a cursor navigation URL by merging the cursor and page size into the
 * current request's query params, replacing any existing cursor params.
 *
 * @param req - The Express request.
 * @param cursor - The cursor value to set.
 * @param cursorParam - Whether this is a next or prev cursor.
 * @param pageSize - Number of items per page.
 * @returns A path-relative URL with cursor and page_size query params merged in.
 */
const buildCursorUrl = (
  req: Request,
  cursor: string,
  cursorParam: 'next_cursor' | 'prev_cursor',
  pageSize: number
): string => {
  const [path, queryString] = req.originalUrl.split('?')
  const params = new URLSearchParams(queryString)
  // Remove both cursor params before setting the new one to avoid duplicates
  params.delete('next_cursor')
  params.delete('prev_cursor')
  params.set(cursorParam, cursor)
  params.set('page_size', String(pageSize))
  return `${path}?${params.toString()}`
}

/**
 * Builds the first-page URL by stripping all cursor and page size params
 * while preserving any other query params such as filters.
 *
 * @param req - The Express request.
 * @returns A path-relative URL with cursor and page_size params removed.
 */
const buildFirstUrl = (req: Request): string => {
  const [path, queryString] = req.originalUrl.split('?')
  const params = new URLSearchParams(queryString)
  params.delete('next_cursor')
  params.delete('prev_cursor')
  params.delete('page_size')
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

/**
 * Wraps a pre-mapped list of entities in a cursor-based pagination envelope.
 *
 * @param req - The Express request, used to construct public-facing URLs.
 * @param data - Pre-mapped entities, each wrapped with {@link toEntity}.
 * @param pageSize - Number of items per page.
 * @param nextCursor - Cursor for the next page. Omit or pass undefined if on the last page.
 * @param prevCursor - Cursor for the previous page. Omit or pass undefined if not supported or on the first page.
 * @returns A {@link CursorListEntity} with self, first, and optional next/prev links.
 *
 * @example
 * const entity = toCursorListEntity(
 *   req,
 *   orders.map((o) => toEntity(req, o, { self: `./orders/${o.id}` })),
 *   10,
 *   'cursor-abc',
 *   'cursor-xyz'
 * )
 */
export const toCursorListEntity = <T, E extends Entity<T>>(
  req: Request,
  data: E[],
  pageSize: number,
  nextCursor?: string | undefined,
  prevCursor?: string | undefined
): CursorListEntity<T> => {
  const _meta: CursorMeta = {
    pageSize,
    ...(nextCursor && { nextCursor }),
    ...(prevCursor && { prevCursor }),
  }

  const links = {
    self: { method: 'GET', href: resolveUrl(req) } as Link,
    first: { method: 'GET', href: resolveUrl(req, buildFirstUrl(req)) } as Link,
    ...(nextCursor && {
      next: {
        method: 'GET',
        href: resolveUrl(
          req,
          buildCursorUrl(req, nextCursor, 'next_cursor', pageSize)
        ),
      } as Link,
    }),
    ...(prevCursor && {
      prev: {
        method: 'GET',
        href: resolveUrl(
          req,
          buildCursorUrl(req, prevCursor, 'prev_cursor', pageSize)
        ),
      } as Link,
    }),
  }

  return { data, _meta, links }
}
