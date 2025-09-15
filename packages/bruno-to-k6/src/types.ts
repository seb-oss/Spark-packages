import type {
  BrunoCollection,
  BrunoEnvironment,
  BrunoFolder,
  BrunoRequest,
} from '@usebruno/lang'

export interface Parent {
  children: (BrunoRequest | Folder)[]
}

export interface Collection extends BrunoCollection, Parent {
  root: string
  environments: Record<string, BrunoEnvironment>
}

export interface Folder extends BrunoFolder, Parent {}

export interface FlattenedRequest {
  path: string
  child: BrunoRequest
}

export interface BrunoJson {
  version: '1'
  name: string
  type: 'collection'
  ignore: string[]
}

export interface EmittedFile {
  filename: string
  contents: string
}

export interface BrunoToK6Opts {
  /** Environment name to load from <root>/environments/<name>.bru (optional). */
  brunoEnvironmentName?: string
  /** Also emit per-request files alongside main output. */
  separate: boolean
  /** Path to a JSON file containing k6 options or a JSON string (up to you later). */
  k6Options?: string
  /** Output file path; if undefined, main script is written to stdout. */
  output?: string
}

export interface ConvertResult {
  main: string
  requests?: Array<{ filename: string; contents: string }>
}

export type JsonObject = {
  [key: string]: JsonValue
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | JsonValue[]
  | JsonObject
