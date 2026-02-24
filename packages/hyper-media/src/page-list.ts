import type { Request } from 'express'
import type { Entity, Link, PageListEntity } from './types'
import { resolveUrl } from './url'

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

const buildPageUrl = (req: Request, page: number, pageSize: number): string => {
  const [path, queryString] = req.originalUrl.split('?')
  const params = new URLSearchParams(queryString)
  params.set('page', String(page))
  params.set('page_size', String(pageSize))
  return `${path}?${params.toString()}`
}
