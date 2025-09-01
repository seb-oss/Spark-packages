// parse.ts — Bruno (.bru) -> IR (mapping via bruToJsonV2)
import { bruToJsonV2, bruToEnvJsonV2, dotenvToJson } from '@usebruno/lang'
import { type IRRequest, type IRTest } from './ir'

type ParseOpts = { path?: string; name?: string }

/**
 * Parse a Bruno `.bru` source string into an `IRRequest`.
 *
 * @param src  Raw `.bru` file content.
 * @param opts Optional metadata used to enrich the IR (e.g., `path`, `name`).
 * @returns    A normalized `IRRequest`.
 */
export const parseBruSource = (
  src: string,
  opts: ParseOpts = {}
): IRRequest => {
  const v2 = bruToJsonV2(src) as any

  // http
  const method = (v2.http?.method || 'GET').toUpperCase()
  const url = v2.http?.url || ''

  // scripts
  const pre = v2.script?.req
  const post = v2.script?.res

  // Bruno 2.10 name/seq come from meta only
  const name = opts.name || v2.meta?.name || 'request'
  const seq = v2.meta?.seq != null ? Number(v2.meta.seq) : undefined

  return {
    name,
    path: opts.path || '',
    method,
    url,
    params: mapParams(v2.params),
    headers: mapHeaders(v2.headers),
    body: mapBody(v2.body),
    auth: mapAuth(v2, src),
    tests: mapTests(v2.tests),
    pre,
    post,
    seq,
  }
}

export interface BrunoEnv {
  name?: string
  vars: Record<string, string>
}

/**
 * Parse a Bruno environment `.bru` source (Bruno ≥ 2.10) into { name?, vars }.
 * Disabled entries (enabled === false) are ignored.
 */
export const parseBrunoEnvSource = (
  src: string
): BrunoEnv => {
  const ast = (bruToEnvJsonV2 as any)(src) as any
  const items = Array.isArray(ast?.variables) ? ast.variables : []
  const vars: Record<string, string> = {}
  for (const it of items) {
    if (it?.enabled === false) continue
    const k = it?.name
    if (!k) continue
    vars[String(k)] = it?.value == null ? '' : String(it.value)
  }
  const name = ast?.name || undefined
  return { name, vars }
}

/**
 * Parse a classic `.env` source into a flat string map.
 * Only include if you actually support dotenv alongside Bruno envs.
 */
export const parseDotenvSource = (
  src: string
): { name?: string; vars: Record<string, string> } => {
  const obj = (dotenvToJson as any)(src) as Record<string, unknown>
  const vars = Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v == null ? '' : String(v)])
  )
  return { name: undefined, vars }
}

/**
 * Merge env maps left-to-right; later keys override earlier keys.
 */
export const mergeEnvs = (
  ...envs: Array<Record<string, string> | undefined>
): Record<string, string> => {
  const out: Record<string, string> = {}
  for (const e of envs) {
    if (!e) continue
    for (const [k, v] of Object.entries(e)) out[k] = v
  }
  return out
}

/* ---------------- internal mappers ---------------- */

// params array -> Record<string,string>
const mapParams = (ps?: unknown): Record<string, string> => {
  if (!Array.isArray(ps)) return {}
  const out: Record<string, string> = {}
  for (const p of ps as Array<{
    name?: string
    key?: string
    value?: unknown
    enabled?: boolean
  }>) {
    const key = p?.name || p?.key
    if (key && p?.enabled !== false) {
      out[key] = p?.value == null ? '' : String(p.value)
    }
  }
  return out
}

// headers array -> IR headers
const mapHeaders = (hs?: any) => {
  if (!Array.isArray(hs)) return []
  return hs.map((h) => ({
    key: h?.key || h?.name || '',
    value: h?.value == null ? '' : String(h.value),
    disabled: h?.enabled === false || h?.disabled === true,
  }))
}

// body mapping for the shapes used in tests (raw/json, form-urlencoded, multipart-form, graphql)
const mapBody = (b?: any): IRRequest['body'] => {
  if (!b) return undefined

  // multipart: body.multipartForm = [{ name?, key?, value? }, ...]
  if (Array.isArray(b.multipartForm)) {
    const items = b.multipartForm as Array<{
      name?: string
      key?: string
      value?: unknown
    }>
    const fields: Record<string, string> = {}
    for (const it of items) {
      const k = it.name ?? it.key
      if (k) fields[k] = it.value == null ? '' : String(it.value)
    }
    return { mode: 'multipart', fields }
  }

  // form-url-encoded: body.formUrlEncoded = [{ name, value }, ...]
  if (Array.isArray(b.formUrlEncoded)) {
    const items = b.formUrlEncoded as Array<{
      name?: string
      key?: string
      value?: unknown
    }>
    const fields: Record<string, string> = {}
    for (const it of items) {
      const k = it.name ?? it.key
      if (k) fields[k] = it.value == null ? '' : String(it.value)
    }
    return { mode: 'form', fields }
  }

  // graphql: body.graphql.query = string
  if (b.graphql?.query) {
    return { mode: 'graphql', text: b.graphql.query }
  }

  // raw JSON-or-text: body.json = string (infer mime)
  if (b.json) {
    const text = b.json
    const mime = looksJson(text) ? 'application/json' : undefined
    return { mode: 'raw', mime, text }
  }

  return undefined
}

// auth mapping for basic, bearer, apikey (apikey header name comes from source)
const mapAuth = (root: any, src: string): IRRequest['auth'] | undefined => {
  const a = root?.auth
  if (!a) return undefined

  if (a.bearer) {
    return {
      type: 'bearer',
      data: { token: String(a.bearer.token ?? a.bearer.value ?? '') },
    }
  }

  if (a.basic) {
    return {
      type: 'basic',
      data: {
        username: String(a.basic.username ?? a.basic.user ?? ''),
        password: String(a.basic.password ?? a.basic.pass ?? ''),
      },
    }
  }

  if (a.apikey) {
    const value = String(a.apikey.value ?? a.apikey.token ?? '')
    let name = String(a.apikey.key ?? '')
    if (!name) {
      // read it from the source block: auth:apikey { name: ... }
      name = readTopLevelKV(src, 'auth:apikey', 'name') || 'X-API-Key'
    }
    return { type: 'apikey', data: { name, value } }
  }

  return undefined
}

/** Read `key: value` from a specific top-level block (e.g., auth:apikey). */
const readTopLevelKV = (
  src: string,
  tag: string,
  key: string
): string | undefined => {
  const esc = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
  const blockRe = new RegExp(
    `^${esc(tag)}\\s*\\{\\s*([\\s\\S]*?)^\\}\\s*$`,
    'm'
  )
  const m = src.match(blockRe)
  if (!m) return undefined
  const body = m[1]
  const lineRe = new RegExp(`^\\s*${esc(key)}\\s*:\\s*(.+?)\\s*$`, 'm')
  const kv = body.match(lineRe)
  return kv ? kv[1] : undefined
}

// tests: top-level text block string (or {text}) -> IRTest[]
const mapTests = (tests?: unknown): IRTest[] => {
  const text: string =
    (typeof tests === 'string' ? tests : (tests as any)?.text) || ''
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  return lines.map(
    (line) =>
      parseTestLine(line) || {
        name: 'custom',
        kind: 'custom',
        args: { code: line },
        raw: line,
      }
  )
}

/* ---------------- helpers ---------------- */

// simple JSON detector for raw body text
const looksJson = (t?: string) => !!t && /^[\s]*[{\[]/.test(String(t))

// tiny assertion recognizer used by tests
const parseTestLine = (line: string): IRTest | null => {
  const m1 = line.match(/expect\s*\(\s*res\.status\s*\)\s*\.to\.equal\((\d+)\)/)
  if (m1)
    return {
      name: `status ${m1[1]}`,
      kind: 'statusEq',
      args: { code: Number(m1[1]) },
      raw: line,
    }

  const m2 = line.match(
    /expect\s*\(\s*json\.([a-zA-Z0-9_.\[\]"]+)\s*\)\s*\.to\.equal\((.+)\)/
  )
  if (m2)
    return {
      name: `json ${m2[1]} equals`,
      kind: 'jsonPathEq',
      args: { path: m2[1], value: m2[2].trim() },
      raw: line,
    }

  const m3 = line.match(/expect\s*\(\s*res\.body\s*\)\s*\.to\.contain\((.+)\)/)
  if (m3)
    return {
      name: 'contains',
      kind: 'contains',
      args: { value: m3[1].trim() },
      raw: line,
    }

  return null
}
