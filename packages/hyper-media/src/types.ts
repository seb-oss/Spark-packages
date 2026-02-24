export type Verb = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface Link {
  method: Verb
  href: string
  title?: string
  description?: string
  deprecated?: boolean
}

export interface Entity<T> {
  data: T
  links: Record<string, Link>
}

export interface PageMeta {
  page: number
  pageSize: number
  total: number
}

export interface CursorMeta {
  pageSize: number
  nextCursor?: string
  prevCursor?: string
}

export interface CursorLinks {
  self: Link
  first: Link
  next?: Link
  prev?: Link
}

export interface PageLinks extends CursorLinks {
  last: Link
}

export interface PageListEntity<T> {
  data: Entity<T>[]
  _meta: PageMeta
  links: PageLinks
}

export interface CursorListEntity<T> {
  data: Entity<T>[]
  _meta: CursorMeta
  links: CursorLinks
}
