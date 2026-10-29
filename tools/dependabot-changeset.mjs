/**
 * Writes a changeset for a Dependabot PR.
 *
 * Every public workspace package whose `dependencies`, `peerDependencies` or
 * `optionalDependencies` differ from `<base-ref>` gets a patch bump.
 * Changes to `devDependencies` don't affect consumers and are ignored.
 *
 * Usage: node tools/dependabot-changeset.mjs <base-ref> <file-name> <summary>
 * Prints the bumped package names, one per line. Writes nothing if there are none.
 */
import { execFileSync } from 'node:child_process'
import { globSync, readFileSync, writeFileSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'

const RELEASED_FIELDS = [
  'dependencies',
  'peerDependencies',
  'optionalDependencies',
]

/**
 * @param {Record<string, unknown> | undefined} before package.json at base, undefined if new
 * @param {Record<string, unknown>} after package.json at head
 */
export const needsRelease = (before, after) =>
  before !== undefined &&
  after.private !== true &&
  RELEASED_FIELDS.some((field) => !isDeepStrictEqual(before[field], after[field]))

/**
 * @param {string[]} packages
 * @param {string} summary
 */
export const renderChangeset = (packages, summary) =>
  `---
${packages.map((name) => `"${name}": patch`).join('\n')}
---

${summary}
`

const readAtRef = (ref, path) => {
  try {
    return JSON.parse(
      execFileSync('git', ['show', `${ref}:${path}`], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      })
    )
  } catch {
    return undefined
  }
}

if (import.meta.main) {
  const [baseRef, fileName, summary] = process.argv.slice(2)
  if (!baseRef || !fileName || !summary) {
    console.error(
      'Usage: node tools/dependabot-changeset.mjs <base-ref> <file-name> <summary>'
    )
    process.exit(1)
  }

  const packages = globSync('packages/*/package.json')
    .filter((path) =>
      needsRelease(
        readAtRef(baseRef, path),
        JSON.parse(readFileSync(path, 'utf8'))
      )
    )
    .map((path) => JSON.parse(readFileSync(path, 'utf8')).name)
    .sort()

  if (packages.length > 0) {
    writeFileSync(
      `.changeset/${fileName}.md`,
      renderChangeset(packages, summary)
    )
  }
  console.log(packages.join('\n'))
}
