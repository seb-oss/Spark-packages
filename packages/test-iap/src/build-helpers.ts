import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/**
 * Works in both CJS and ESM without tripping bundlers:
 * - CJS: derives from __filename
 * - ESM: evals import.meta.url so it's not statically analyzed
 */
export const getThisFileUrl = (): string => {
  if (typeof __filename !== 'undefined') {
    return pathToFileURL(__filename).href
  }
  // biome-ignore lint/security/noGlobalEval: needed for cjs/esm compatibility
  // biome-ignore lint/complexity/noCommaOperator: needed for cjs/esm compatibility
  return (0, eval)('import.meta.url') as string
}

/** Directory of the current compiled file (e.g., your package's dist dir) */
export const getThisDir = (): string =>
  path.dirname(fileURLToPath(getThisFileUrl()))

/** A require() that works in both CJS and ESM builds */
export const getRequireCompat = (): ReturnType<typeof createRequire> =>
  typeof require === 'function' ? require : createRequire(getThisFileUrl())

/**
 * Resolve a module specifier relative to this package’s installed location.
 * Example: resolveNearSelf('jose/package.json')
 */
export const resolveNearSelf = (specifier: string): string => {
  const req = getRequireCompat()
  return req.resolve(specifier, { paths: [getThisDir()] })
}

/** Safe resolve: returns undefined if not found */
export const tryResolveNearSelf = (specifier: string): string | undefined => {
  try {
    return resolveNearSelf(specifier)
  } catch {
    return undefined
  }
}
