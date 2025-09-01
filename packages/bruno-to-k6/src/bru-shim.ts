export type MutableMap<T = unknown> = Record<string, T>

export interface BruShim {
  // --- environments (docs.usebruno.com -> Environments) ---
  setEnvVar: (key: string, value: unknown, opts?: { persist?: boolean }) => void
  getEnvVar: (key: string) => string | undefined
  deleteEnvVar: (key: string) => void
  hasEnvVar: (key: string) => boolean

  // global/collection/folder (read from provided maps)
  setGlobalEnvVar: (key: string, value: unknown) => void
  getGlobalEnvVar: (key: string) => string | undefined
  getCollectionVar: (key: string) => string | undefined
  getFolderVar: (key: string) => string | undefined

  // node process env (docs: getProcessEnv)
  getProcessEnv: (key: string) => string | undefined

  // runtime vars (docs: Runtime Variables)
  hasVar: (key: string) => boolean
  getVar: <T = unknown>(key: string) => T | undefined
  setVar: (key: string, value: unknown) => void
  deleteVar: (key: string) => void
  deleteAllVars: () => void

  // helpers (docs: Helpers)
  interpolate: (input: string) => string
  sleep: (ms: number) => Promise<void>
  disableParsingResponseJson: () => void

  // request order / runner hooks (docs: Request Order / Runner Utils)
  setNextRequest: (name: string) => void
  runRequest: (pathName: string) => Promise<unknown>

  // info (docs: Environments / Collection Information)
  getEnvName: () => string | undefined
  getCollectionName: () => string | undefined
  cwd: () => string

  // exposed flags/state toggled by helpers
  readonly flags: {
    disableJsonParsing: boolean
    nextRequest?: string
  }
}

export interface CreateBruShimOpts {
  env: MutableMap<string> // mutable; pre/post scripts write here
  vars?: MutableMap // mutable runtime vars
  globals?: MutableMap<string> // mutable global env
  collectionVars?: MutableMap<string> // read-only view for now
  folderVars?: MutableMap<string> // read-only view for now
  envName?: string
  collectionName?: string
  cwd?: string
  onRunRequest?: (pathName: string) => Promise<unknown>
  onSetNextRequest?: (name: string) => void
}

export const createBruShim = (opts: CreateBruShimOpts): BruShim => {
  const {
    env,
    vars = {},
    globals = {},
    collectionVars = {},
    folderVars = {},
    envName,
    collectionName,
    cwd = process.cwd(),
    onRunRequest,
    onSetNextRequest,
  } = opts

  const flags = {
    disableJsonParsing: false as boolean,
    nextRequest: undefined as string | undefined,
  }

  const coerce = (v: unknown) => (v == null ? '' : String(v))

  return {
    // envs
    setEnvVar: (k, v) => {
      env[k] = coerce(v)
    },
    getEnvVar: (k) => env[k],
    deleteEnvVar: (k) => {
      delete env[k]
    },
    hasEnvVar: (k) => Object.prototype.hasOwnProperty.call(env, k),

    // globals / collection / folder
    setGlobalEnvVar: (k, v) => {
      globals[k] = coerce(v)
    },
    getGlobalEnvVar: (k) => globals[k],
    getCollectionVar: (k) => collectionVars[k] as string | undefined,
    getFolderVar: (k) => folderVars[k] as string | undefined,

    // process env
    getProcessEnv: (k) => process.env?.[k] as string | undefined,

    // runtime vars
    hasVar: (k) => Object.prototype.hasOwnProperty.call(vars, k),
    getVar: <T>(k: string) => vars[k] as T,
    setVar: (k, v) => {
      vars[k] = v
    },
    deleteVar: (k) => {
      delete vars[k]
    },
    deleteAllVars: () => {
      for (const k of Object.keys(vars)) delete vars[k]
    },

    // helpers
    interpolate: (input: string) =>
      interpolateString(input, {
        env,
        vars,
        globals,
        collectionVars,
        folderVars,
      }),
    sleep: (ms: number) => new Promise((res) => setTimeout(res, ms)),
    disableParsingResponseJson: () => {
      flags.disableJsonParsing = true
    },

    // runner hooks
    setNextRequest: (name: string) => {
      flags.nextRequest = name
      onSetNextRequest?.(name)
    },
    runRequest: async (pathName: string) => {
      if (!onRunRequest) throw new Error('runRequest handler not provided')
      return onRunRequest(pathName)
    },

    // info
    getEnvName: () => envName,
    getCollectionName: () => collectionName,
    cwd: () => cwd,

    // flags (read-only object reference)
    flags,
  }
}

// very small {{var}} + {{env.VAR}} + {{global.VAR}} resolver
const interpolateString = (
  input: string,
  ctx: {
    env: MutableMap<string>
    vars: MutableMap
    globals: MutableMap<string>
    collectionVars: MutableMap<string>
    folderVars: MutableMap<string>
  }
): string => {
  if (!input) return input
  return input.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, key: string) => {
    // support namespaces like env.TOKEN, global.X, folder.Y, collection.Z
    if (key.startsWith('env.')) return ctx.env[key.slice(4)] ?? ''
    if (key.startsWith('global.')) return ctx.globals[key.slice(7)] ?? ''
    if (key.startsWith('folder.')) return ctx.folderVars[key.slice(7)] ?? ''
    if (key.startsWith('collection.'))
      return ctx.collectionVars[key.slice(11)] ?? ''
    // plain key -> runtime vars first, then env
    const v = ctx.vars[key]
    if (v !== undefined) return String(v)
    return ctx.env[key] ?? ''
  })
}
