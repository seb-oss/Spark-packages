import path from 'node:path'
import { type RunPlan } from './plan'

/** Options influencing main k6 script generation. */
export interface GenerateMainOptions {
  /** Flat environment variables to embed or load at runtime (optional). */
  env?: Record<string, string>
  /**
   * Optional k6 options payload; your generator decides the shape
   * (could be a parsed object or a JSON string path handled elsewhere).
   */
  k6Options?: unknown
}

/** Single emitted request file (used when --separate is enabled). */
export interface EmittedRequestFile {
  /** Output filename (without directories). */
  filename: string
  /** File contents. */
  contents: string
}

/**
 * Generate the main k6 script content from a RunPlan.
 *
 * @param plan High-level execution plan.
 * @param opts Generation-time options (env, k6 options, etc.).
 * @returns    Main k6 script as a string.
 */
export function generateK6Main(plan: RunPlan, opts: GenerateMainOptions): string {
  const lines: string[] = []

  // Imports (keep it dead simple for now)
  lines.push(`import http from 'k6/http'`)
  lines.push(`import { sleep, check } from 'k6'`)
  lines.push('')

  // Optional k6 options block if provided
  if (opts?.k6Options && typeof opts.k6Options === 'object') {
    const json = JSON.stringify(opts.k6Options, null, 2)
    lines.push(`export const options = ${json}`)
    lines.push('')
  }

  // Optional ENV embedding (flat KV)
  if (opts?.env && Object.keys(opts.env).length > 0) {
    const envJson = JSON.stringify(opts.env, null, 2)
    lines.push(`const ENV = ${envJson}`)
    lines.push('')
  }

  // Naive per-request emit: make the method and url appear in the output
  // so tests can assert their presence, while remaining runnable.
  lines.push(`export default function () {`)
  if (plan.requests.length === 0) {
    lines.push(`  // no requests in plan`)
  } else {
    let ix = 0
    for (const r of plan.requests) {
      ix++
      const m = r.method
      const u = r.url
      
      // --- per-request emit (minimal: raw JSON bodies + headers) ---
      lines.push(`  // ${r.method} ${r.url}`)

      const args: string[] = [`'${r.method}'`, `'${r.url}'`]

      // Body: only handle raw JSON (what your simple collection uses)
      if (r.body?.mode === 'raw') {
        const bodyText = r.body.text != null ? JSON.stringify(r.body.text) : 'null'
        args.push(bodyText)
      }

      // Headers: start from enabled (i.e., not disabled) request headers
      const headers: Record<string, string> = {}
      for (const h of r.headers ?? []) {
        if (!h?.key) continue
        if (h.disabled) continue
        headers[h.key] = h.value ?? ''
      }

      // If raw body has a mime, add it (your POST/PUT are application/json)
      if (r.body?.mode === 'raw' && r.body.mime) {
        headers['Content-Type'] = r.body.mime
      }

      // Options arg with headers (only if we have any)
      if (Object.keys(headers).length > 0) {
        args.push(`{ headers: ${JSON.stringify(headers)} }`)
      }

      lines.push(`  const res${ix > 1 ? ix : ''} = http.request(${args.join(', ')})`)
      lines.push(`  check(res${ix > 1 ? ix : ''}, { "status < 400": r => r.status < 400 })`)
      lines.push(``)
    }
    lines.push(`  sleep(1)`)
  }
  lines.push(`}`)

  return lines.join('\n')
}

/**
 * Generate per-request k6 files from a RunPlan.
 *
 * @param plan High-level execution plan.
 * @returns    Array of request files to write next to the main script.
 */
export function generateK6RequestFiles(plan: RunPlan): EmittedRequestFile[] {
  return plan.requests.map(req => {
    const stem = req.name && req.name.trim() ? toKebab(req.name) : toKebab(stemFromPath(req.path))
    const filename = `${stem}.js`
    const contents =
      [
        `import http from 'k6/http'`,
        ``,
        `// ${req.method} ${req.url}`,
        `export function run() {`,
        `  http.request('${req.method}', '${req.url}')`,
        `}`,
        ``,
      ].join('\n')

    return { filename, contents }
  })
}

const toKebab = (s: string): string => {
  // normalize: trim → replace non-alphanum with space → split → join with hyphen → lowercase
  const core = s
    .trim()
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .join('-')
    .toLowerCase()
  return core || 'request'
}

const stemFromPath = (p: string): string => {
  const base = path.basename(p || 'request.bru')
  return base.replace(/\.bru$/i, '') || 'request'
}
