#!/usr/bin/env node

/**
 * Ensures no source file imports from a local dist/ directory.
 * Importing from dist/ in source/spec files means the test or module
 * depends on a prior build step, which breaks CI when running tests
 * without building first.
 */

import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'

const PACKAGES_DIR = new URL('../packages', import.meta.url).pathname
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs'])
// Matches relative paths only: from '../dist/...', from './dist/...' etc.
const DIST_IMPORT = /from\s+['"]\.\.?[^'"]*\/dist\//

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue
      yield* walk(full)
    } else if (EXTENSIONS.has(extname(entry.name))) {
      yield full
    }
  }
}

let violations = 0

for await (const file of walk(PACKAGES_DIR)) {
  const content = await readFile(file, 'utf8')
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (DIST_IMPORT.test(lines[i])) {
      console.error(
        `${relative(process.cwd(), file)}:${i + 1}: imports from local dist/ — import from source instead`
      )
      violations++
    }
  }
}

if (violations > 0) {
  console.error(`\n${violations} dist import(s) found.`)
  process.exit(1)
}
