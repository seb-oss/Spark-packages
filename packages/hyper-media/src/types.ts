/** HTTP methods available for hypermedia links. */
export type Verb = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** A hypermedia link with an HTTP method and a public-facing URL. */
export interface Link {
  method: Verb
  href: string
  /** Short human-readable label for the link. */
  title?: string
  /** Longer description of what following the link does. */
  description?: string
  /** Indicates the link target is deprecated and may be removed in a future version. */
  deprecated?: boolean
}

/** A hypermedia entity envelope wrapping data with navigational links. */
export interface Entity<T> {
  data: T
  links: Record<string, Link>
}

/** Pagination metadata for page-based list responses. */
export interface PageMeta {
  page: number
  pageSize: number
  total: number
}

/** Pagination metadata for cursor-based list responses. */
export interface CursorMeta {
  pageSize: number
  /** Cursor to pass as next_cursor to retrieve the next page. Absent on the last page. */
  nextCursor?: string
  /** Cursor to pass as prev_cursor to retrieve the previous page. Absent on the first page or when bidirectional paging is not supported. */
  prevCursor?: string
}

/** Navigational links for cursor-based list responses. */
export interface CursorLinks {
  self: Link
  first: Link
  /** Absent on the last page. */
  next?: Link
  /** Absent on the first page or when bidirectional paging is not supported. */
  prev?: Link
}

/** Navigational links for page-based list responses. Extends {@link CursorLinks} with a last page link. */
export interface PageLinks extends CursorLinks {
  last: Link
}

/** A cursor-based paginated list entity. */
export interface CursorListEntity<T> {
  data: Entity<T>[]
  _meta: CursorMeta
  links: CursorLinks
}

/** A page-based paginated list entity. */
export interface PageListEntity<T> {
  data: Entity<T>[]
  _meta: PageMeta
  links: PageLinks
}
