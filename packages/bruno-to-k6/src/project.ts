import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * Locate the Bruno collection root by walking up from a file/dir
 * until a directory containing `bruno.json` is found.
 *
 * @param start Absolute or relative path to a .bru file or directory.
 * @returns Absolute path to the discovered Bruno root directory.
 */
export async function findBrunoRoot(start: string): Promise<string> {
  let dir = path.resolve(start)
  try {
    const stat = await fs.stat(dir)
    if (stat.isFile()) dir = path.dirname(dir)
  } catch {
    // if the path doesn't exist, still attempt walking up from its dirname
    dir = path.dirname(dir)
  }

  // Walk up until we find bruno.json or reach filesystem root
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = path.join(dir, 'bruno.json')
    try {
      await fs.access(candidate)
      return dir
    } catch {
      /* not here, keep walking */
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  throw new Error('Could not locate bruno.json (starting from input path)')
}

/**
 * Enumerate request files (.bru) to convert.
 *
 * @param inputAbs Absolute path passed by the user (file or directory).
 * @param root     Absolute path to the Bruno root (directory with bruno.json).
 * @returns        Absolute paths to .bru request files, in execution order if applicable.
 */
export async function listRequestFiles(inputAbs: string, root: string): Promise<string[]> {
  const absInput = path.resolve(inputAbs)
  const absRoot  = path.resolve(root)
  const envDir   = path.join(absRoot, 'environments')

  const stat = await fs.stat(absInput)

  if (stat.isFile()) {
    if (!absInput.endsWith('.bru')) {
      throw new Error(`Not a .bru file: ${absInput}`)
    }
    return [absInput]
  }

  // input is a directory → walk recursively for .bru files
  const out: string[] = []

  const walk = async (dir: string) => {
    // skip the root-level environments directory
    const isEnvRoot = path.resolve(dir) === envDir
    if (isEnvRoot) return

    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(full)
      } else if (entry.isFile() && entry.name.endsWith('.bru')) {
        out.push(path.resolve(full))
      }
    }
  }

  await walk(absInput)
  return out.sort()
}

/**
 * Resolve an environment file by its logical name.
 * Typically lives under `<root>/environments/<name>.bru`.
 *
 * @param root Bruno root directory (absolute).
 * @param name Environment name (folder/file stem).
 * @returns    Absolute path to the environment .bru file.
 */
export async function resolveEnvFileByName(root: string, name: string): Promise<string> {
  const envPath = path.resolve(root, 'environments', `${name}.bru`)
  let stat
  try {
    stat = await fs.stat(envPath)
  } catch {
    throw new Error(`Environment "${name}" not found: ${envPath}`)
  }
  if (!stat.isFile()) {
    throw new Error(`Environment "${name}" is not a file: ${envPath}`)
  }
  return envPath
}
