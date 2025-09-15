import { accessSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import type { BrunoEnvironment, BrunoRequest } from '@usebruno/lang'
import { kebabCase } from 'case-anything'
import { parseEnv, parseFolder, parseRequest } from './parser'
import type { BrunoJson, Collection, FlattenedRequest, Folder } from './types'

/**
 * Find the Bruno collection root directory by walking upwards from `start`
 * until a directory containing `bruno.json` is found.
 *
 * - If `start` is a file, the search starts at its parent directory.
 * - If `start` doesn't exist, we still walk up from its dirname.
 *
 * @param start File or directory path (absolute or relative)
 * @throws if no `bruno.json` is found before reaching the filesystem root
 * @returns absolute path to the directory containing `bruno.json`
 */
export const findBrunoRoot = (start: string): string => {
  let dir = path.resolve(start)
  try {
    if (statSync(dir).isFile()) dir = path.dirname(dir)
  } catch {
    // missing path is fine — begin from its parent
    dir = path.dirname(dir)
  }

  // Walk upward until we either find bruno.json or reach the FS root
  let parent = path.dirname(dir)
  while (dir !== parent) {
    const candidate = path.join(dir, 'bruno.json')
    try {
      accessSync(candidate)
      return dir
    } catch {
      // not here → keep walking
    }
    dir = parent
    parent = path.dirname(dir)
  }

  throw new Error(`Could not locate bruno.json (starting from ${start})`)
}

/**
 * Read environments from `<root>/environments/*.bru` (if present).
 *
 * @param root absolute path to the Bruno root (directory with bruno.json)
 * @returns a name→environment map, possibly empty if no environments folder
 */
const readEnvironments = (root: string) => {
  const environments: Record<string, BrunoEnvironment> = {}
  const envDir = path.join(root, 'environments')

  try {
    const entries = readdirSync(envDir, { withFileTypes: true })
    for (const e of entries) {
      if (!e.isFile() || !e.name.endsWith('.bru')) continue
      const abs = path.join(envDir, e.name)
      const name = path.basename(e.name, path.extname(e.name))
      const bru = readFileSync(abs, 'utf8')
      environments[name] = parseEnv(bru)
    }
  } catch {
    // no environments directory is fine
  }

  return environments
}

/**
 * Parse a single request .bru file into a BrunoRequest.
 * Ignores folder definition files (folder.bru).
 *
 * @param filePath absolute path to a .bru file
 * @returns BrunoRequest or undefined if not a request file
 */
const readRequestFile = (filePath: string): BrunoRequest | undefined => {
  if (!filePath.endsWith('.bru') || path.basename(filePath) === 'folder.bru')
    return undefined
  const bru = readFileSync(filePath, 'utf8')
  try {
    return parseRequest(bru)
  } catch (err) {
    throw new Error(`Error parsing ${filePath}`, { cause: err })
  }
}

/**
 * Read a folder at `dirPath` using its `folder.bru`, then include its children.
 *
 * @param dirPath absolute path to the folder directory
 * @param root    absolute path to the Bruno root (for env skipping in children)
 * @returns a Folder node (with children) or undefined if `folder.bru` is missing
 */
const readFolder = (dirPath: string, root: string): Folder | undefined => {
  const entries = readdirSync(dirPath, { withFileTypes: true })
  const folderFile = entries.find((e) => e.isFile() && e.name === 'folder.bru')
  if (!folderFile) {
    // Non-standard on disk — we warn but continue traversal elsewhere
    console.error(`Cannot find folder.bru in ${dirPath}`)
    return undefined
  }

  const src = readFileSync(path.join(dirPath, 'folder.bru'), 'utf8')
  const folder = parseFolder(src)

  return {
    ...folder,
    children: readChildren(dirPath, root),
  } as Folder
}

/**
 * Read children (folders and requests) in a directory, skipping `<root>/environments`.
 *
 * Sorts results by `meta.seq` where present.
 *
 * @param dir  absolute path to the directory whose children to read
 * @param root absolute path to the Bruno root (used to skip environments dir)
 * @returns array of BrunoRequest or Folder nodes
 */
const readChildren = (dir: string, root: string) => {
  const out: (BrunoRequest | Folder)[] = []
  const entries = readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const abs = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      // skip the root-level environments directory
      if (abs === path.join(root, 'environments')) continue
      const folder = readFolder(abs, root)
      if (folder) out.push(folder)
      continue
    }

    if (
      entry.isFile() &&
      entry.name.endsWith('.bru') &&
      entry.name !== 'folder.bru'
    ) {
      const req = readRequestFile(abs)
      if (req) out.push(req)
    }
  }

  out.sort((a, b) => (a.meta.seq ?? 0) - (b.meta.seq ?? 0))
  return out
}

/**
 * Build a wrapped subtree for a target directory relative to root:
 *
 * Example:
 *   root/.../Users/Posts  +  children=[requests under Posts]
 *   → [ Users { children: [ Posts { children: children } ] } ]
 *
 * If a directory in the chain lacks `folder.bru`, a minimal folder node is
 * synthesized with its filesystem name.
 *
 * @param root        Bruno root directory
 * @param targetDir   absolute path to the directory to wrap
 * @param leafChildren children that live directly under `targetDir`
 * @returns an array containing the top-most ancestor folder wrapping the leaf
 */
const wrapWithAncestors = (
  root: string,
  targetDir: string,
  leafChildren: (BrunoRequest | Folder)[]
): (BrunoRequest | Folder)[] => {
  const rel = path.relative(root, targetDir)
  if (!rel || rel === '.') return leafChildren

  const segments = rel.split(path.sep).filter(Boolean)

  // Build bottom-up: start from the leaf's direct children and wrap one level at a time.
  let children: (BrunoRequest | Folder)[] = leafChildren
  for (let i = segments.length - 1; i >= 0; i--) {
    const abs = path.join(root, ...segments.slice(0, i + 1))
    const folder = readFolder(abs, root)
    if (!folder) {
      // Missing folder.bru (non-standard) → synthesize a minimal node from the path segment
      const name = segments[i]
      children = [
        {
          meta: { type: 'folder', name, seq: 0 } as any,
          auth: {},
          children,
        } as Folder,
      ]
    } else {
      children = [{ ...folder, children }] as (BrunoRequest | Folder)[]
    }
  }

  return children
}

/**
 * Read a collection scoped to the provided path (root dir, subfolder, or single .bru file).
 *
 * Rules:
 * - Always load environments from the discovered Bruno root: `<root>/environments`.
 * - If `inputPath` is the root → traverse the whole collection (excluding environments).
 * - If `inputPath` is a subfolder → read only that folder's subtree, wrapped by ancestors.
 * - If `inputPath` is a single request file → wrap the request with its ancestor folders.
 *
 * @param inputPath absolute or relative path to root directory, subfolder, or a .bru file
 * @returns a Collection object with `root`, `meta`, `environments`, and `children`
 */
export const readCollection = (inputPath: string): Collection => {
  const root = findBrunoRoot(inputPath)
  const brunoJson = JSON.parse(
    readFileSync(path.join(root, 'bruno.json'), 'utf8')
  ) as BrunoJson

  const environments = readEnvironments(root)
  const absInput = path.resolve(inputPath)
  const st = statSync(absInput)

  let children: (BrunoRequest | Folder)[] = []

  if (st.isFile()) {
    // Single request → parse and wrap in its ancestor folders
    const req = readRequestFile(absInput)
    if (req) {
      const dirOfFile = path.dirname(absInput)
      children = wrapWithAncestors(root, dirOfFile, [req])
    }
  } else if (st.isDirectory()) {
    if (absInput === root) {
      // Whole collection
      children = readChildren(root, root)
    } else {
      // Subfolder scope → read just that subtree then wrap it with its ancestors
      const leafChildren = readChildren(absInput, root)
      children = wrapWithAncestors(root, absInput, leafChildren)
    }
  }

  return {
    root,
    meta: {
      type: 'collection',
      name: brunoJson.name,
    },
    environments,
    children,
  }
}

/**
 * Flatten a nested tree of folders/requests into a list of request entries
 * with path hints (kebab-cased segments like `users/posts/get-post`).
 *
 * @param children top-level children to flatten
 * @param paths    path segments accumulated so far (used by recursion)
 * @returns list of { path, child } pairs for all requests in the subtree
 */
export const flatten = (
  children: (BrunoRequest | Folder)[],
  paths: string[] = []
) => {
  const list: FlattenedRequest[] = []

  for (const child of children) {
    const p = [...paths, kebabCase(child.meta.name)]

    if (child.meta.type === 'http') {
      list.push({ path: p.join('/'), child: child as BrunoRequest })
    } else if (child.meta.type === 'folder') {
      list.push(...flatten((child as Folder).children, p))
    }
  }

  return list
}
