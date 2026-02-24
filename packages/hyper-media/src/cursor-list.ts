import type { Request } from 'express'
import type { CursorListEntity, CursorMeta, Entity, Link } from './types'
import { resolveUrl } from './url'

const buildCursorUrl = (
  req: Request,
  cursor: string,
  cursorParam: 'next_cursor' | 'prev_cursor',
  pageSize: number
): string => {
  const [path, queryString] = req.originalUrl.split('?')
  const params = new URLSearchParams(queryString)
  params.delete('next_cursor')
  params.delete('prev_cursor')
  params.set(cursorParam, cursor)
  params.set('page_size', String(pageSize))
  return `${path}?${params.toString()}`
}

const buildFirstUrl = (req: Request): string => {
  const [path, queryString] = req.originalUrl.split('?')
  const params = new URLSearchParams(queryString)
  params.delete('next_cursor')
  params.delete('prev_cursor')
  params.delete('page_size')
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

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
