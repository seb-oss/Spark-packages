import path from 'node:path'
import { flatten, readCollection } from './collection'
import {
  type GenerateMainOptions,
  generateMain,
  generateSeparate,
} from './generate'
import { ensureDir, writeText } from './io'
import type { BrunoToK6Opts, ConvertResult } from './types'

/**
 * Convert a Bruno file or collection directory into k6 script(s).
 *
 * Steps:
 * 1) Build a scoped collection (root, subfolder, or single request), always loading environments from the bruno root
 * 2) Optionally select an environment by name
 * 3) Flatten the collection tree to an ordered list of requests with paths
 * 4) Generate either a single-file main or separate files
 * 5) Optionally write outputs to disk
 */
export const convertBrunoFileOrCollection = async (
  inputPath: string,
  opts: BrunoToK6Opts
): Promise<ConvertResult> => {
  const absInput = path.resolve(process.cwd(), inputPath)

  // 1) read a scoped collection (handles root / subfolder / single .bru)
  const collection = readCollection(absInput)

  // 2) pick environment (optional) — pass through unchanged
  const selectedEnv = opts.brunoEnvironmentName
    ? collection.environments?.[opts.brunoEnvironmentName]
    : undefined
  if (opts.brunoEnvironmentName && !selectedEnv) {
    throw new Error(
      `Environment "${opts.brunoEnvironmentName}" not found under ${collection.root}/environments`
    )
  }

  // 3) flatten requests
  const items = flatten(collection.children)
  if (!items.length) {
    throw new Error(`No .bru request files found under ${absInput}`)
  }

  // 4) generate code
  const genOpts: GenerateMainOptions = {
    env: selectedEnv,
    k6Options: opts.k6Options,
  }
  let main: string
  let requestFiles: Array<{ filename: string; contents: string }> | undefined

  if (opts.separate) {
    const res = generateSeparate(items, genOpts)
    main = res.main
    requestFiles = res.files
  } else {
    main = generateMain(items, genOpts)
  }

  // 5) optionally write to disk
  if (opts.output) {
    const outFile = path.resolve(process.cwd(), opts.output)
    const outDir = path.dirname(outFile)
    await ensureDir(outDir)
    await writeText(outFile, main)

    if (opts.separate && requestFiles?.length) {
      for (const f of requestFiles) {
        const full = path.join(outDir, f.filename) // f.filename already 'requests/<path>.js'
        await ensureDir(path.dirname(full))
        await writeText(full, f.contents)
      }
    }
  }

  return { main, requests: requestFiles }
}
