import path from 'node:path'
import { findBrunoRoot, listRequestFiles, resolveEnvFileByName } from './project'
import { parseBruSource, parseBrunoEnvSource } from './parse'
import { buildRunPlan } from './plan'
import { generateK6Main, generateK6RequestFiles } from './generate'
import { readText, writeText, ensureDir } from './io'

/* ---- public types ---- */

export interface BrunoToK6Opts {
  /** Environment name to load from <root>/environments/<name>.bru (optional). */
  environment?: string
  /** Also emit per-request files alongside main output. */
  separate: boolean
  /** Path to a JSON file containing k6 options or a JSON string (up to you later). */
  k6Options?: string
  /** Output file path; if undefined, main script is written to stdout. */
  output?: string
}

export type ConvertResult = {
  main: string
  requests?: Array<{ filename: string; contents: string }>
}

/**
 * Convert a Bruno file or collection directory into k6 script(s).
 *
 * Orchestration only — delegates to `project`, `parse`, `plan`, `generate`, `io`.
 * - Discovers Bruno root (folder with bruno.json)
 * - Collects request files (.bru) to convert
 * - Resolves the requested environment by name (if provided)
 * - Builds a run plan (order, tags, etc.) for codegen
 * - Generates main k6 script and optional per-request files
 * - Writes outputs when `opts.output` is provided (stdout otherwise)
 */
export const convertBrunoFileOrCollection = async (
  inputPath: string,
  opts: BrunoToK6Opts
): Promise<ConvertResult> => {
  const absInput = path.resolve(process.cwd(), inputPath)

  // 1) locate bruno root
  const root = await findBrunoRoot(absInput) // throws if not found

  // 2) collect request files
  const requestFiles = await listRequestFiles(absInput, root) // returns absolute paths to *.bru requests

  if (!requestFiles.length) {
    throw new Error(`No .bru request files found under ${absInput}`)
  }

  // 3) resolve environment (optional)
  let envVars: Record<string, string> | undefined
  if (opts.environment) {
    const envFile = await resolveEnvFileByName(root, opts.environment)
    const envSrc = await readText(envFile)
    envVars = parseBrunoEnvSource(envSrc).vars
  }

  // 4) parse requests → IR
  const requestsIR = []
  for (const file of requestFiles) {
    const src = await readText(file)
    const ir = parseBruSource(src, { path: file })
    requestsIR.push(ir)
  }

  // 5) build plan (ordering, groups, tags, etc.)
  const plan = buildRunPlan({
    root,
    requests: requestsIR,
    env: envVars,
  })

  // 6) generate k6 code
  const main = generateK6Main(plan, {
    env: envVars,
    k6Options: opts.k6Options, // pass-through for now
  })

  const requests = opts.separate
    ? generateK6RequestFiles(plan)
    : undefined

  // 7) write outputs (if desired)
  if (opts.output) {
    const outFile = path.resolve(process.cwd(), opts.output)
    const outDir = path.dirname(outFile)
    await ensureDir(outDir)
    await writeText(outFile, main)

    if (opts.separate && requests?.length) {
      const reqDir = path.join(outDir, 'requests')
      await ensureDir(reqDir)
      await Promise.all(
        requests.map(f => writeText(path.join(reqDir, f.filename), f.contents))
      )
    }
  }

  return { main, requests }
}
