import { BrunoEnvironment } from '@usebruno/lang'
import { camelCase } from 'case-anything'
import { JsonObject } from './types'

/**
 * Pretty serializer:
 * - Uses JSON.stringify (preserving key ordering rules of JS/JSON)
 * - Unquotes identifier-safe keys; quotes others with single quotes
 * - Converts string values to single-quoted JS strings
 * - In single-line mode, inserts a space after commas
 */
export const jsonSerialize = (
  value: unknown,
  multilineOrIndent: number | true | undefined = undefined
): string => {
  const multiline = !!multilineOrIndent
  const indent =
    typeof multilineOrIndent === 'number' && (multilineOrIndent as number) > 0
      ? multilineOrIndent
      : 0
  let s = multiline ? JSON.stringify(value, null, 2) : JSON.stringify(value)

  // keys:  "safeId":  => safeId
  s = s.replace(/"([A-Za-z_$][A-Za-z0-9_$]*)":/g, '$1: ')

  // all other keys: "weird-key":  => 'weird-key':
  s = s.replace(/"((?:\\.|[^"\\])*)":/g, `'$1': `)

  // ensure exactly one space after every colon (outside strings)
  s = s.replace(/: {2}/g, ': ')

  // all other double quotes
  s = s.replace(/"/g, `'`)

  if (!multiline) {
    // space after , unless eol
    s = s.replace(/,(?!\n|$)/g, ', ')
  } else if (indent > 0) {
    const pad = ' '.repeat(indent)
    s = s.split('\n').join(`\n${pad}`)
  }

  return s
}

export const jsonParse = (value: string): string | unknown => {
  try {
    const obj = JSON.parse(value)
    return obj
  } catch {
    return value
  }
}

export const jsonCoerceFields = (
  fields: Record<string, unknown>
): Record<string, unknown> => {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(fields)) {
    if (typeof v === 'string') {
      const t = v.trim()
      // Parse only obvious JSON shapes or literals; keep numeric strings as strings
      if (
        t.startsWith('{') ||
        t.startsWith('[') ||
        t === 'true' ||
        t === 'false' ||
        t === 'null'
      ) {
        try {
          out[k] = JSON.parse(t)
          continue
        } catch {
          // fall through to keep original string
        }
      }
    }
    out[k] = v
  }
  return out
}

export const jsonCoerceAndSerialize = (
  value: string | Record<string, unknown>
) => {
  try {
    const parsed =
      typeof value === 'string' ? jsonParse(value) : jsonCoerceFields(value)
    return jsonSerialize(parsed)
  } catch {
    return jsonSerialize(value)
  }
}

export const jsonSerializeEnvironment = (env: BrunoEnvironment) => {
  const flatObject: JsonObject = {}
  for (const envVar of env.variables?.filter(ev => ev.enabled && ev.value) || []) {
    flatObject[envVar.name as string] = envVar.value as string
  }
  return jsonSerialize(flatObject, true)
}

/** Turn a filename like "foo-bar.ts" into a safe JS identifier "fooBar".
 *  - Strips the final extension (e.g. ".ts", ".js", ".bru", etc.)
 *  - Camel-cases the rest (treat any non-identifier char as a separator)
 *  - Preserves a single leading "$" or "_" if present
 *  - Ensures a valid identifier start (prefix "_" if needed)
 */
export const fileToImportName = (filename: string): string => {
  // keep a single leading $ or _
  const lead =
    filename.startsWith('$') || filename.startsWith('_') ? filename[0] : ''
  const tail = lead ? filename.slice(1) : filename

  // strip final extension (last ".ext" segment), without touching path parts
  const base = tail.replace(/(^|[\\/])([^\\/]+)$/, (_m, prefix, last) => {
    const noExt = last.replace(/\.[^./\\]+$/, '')
    return `${prefix}${noExt}`
  })

  // collapse non-identifier chars to spaces, camelCase the result
  let id = lead + camelCase(base.replace(/[^A-Za-z0-9_$]+/g, ' ').trim())

  // ensure valid identifier start
  if (!/^[A-Za-z_$]/.test(id)) id = `_${id}`

  return id || '_'
}

// escape for single-quoted JS string
export const escapeString = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')
