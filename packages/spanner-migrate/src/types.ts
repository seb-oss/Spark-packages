import type { Database } from '@google-cloud/spanner'

export type Migration = {
  id: string
  description: string
  up: string
  down: string
  appliedAt?: Date
}

export type DatabaseConfig = {
  name: string
  migrationsPath: string
}

export type InstanceConfig = {
  name: string
  databases: DatabaseConfig[]
}

export type Config = {
  instance: InstanceConfig
  projectId?: string
}

export type DbPath = {
  projectId?: string
  instanceName: string
  databaseName: string
}

export type ExecuteSqlRequest = Extract<Parameters<Database['run']>[0], object>
export type RunResponse = Database['run'] extends {
  // biome-ignore lint/suspicious/noExplicitAny: Defined by Dependency
  (q: any): Promise<infer R>
  // biome-ignore lint/suspicious/noExplicitAny: Defined by Dependency
  (q: any, o?: any): Promise<infer R>
  // biome-ignore lint/suspicious/noExplicitAny: Defined by Dependency
  (...args: any[]): any
}
  ? R
  : never
type Rows = RunResponse[0]
// biome-ignore lint/suspicious/noExplicitAny: Defined by Dependency
export type Row = Extract<Rows[number], { toJSON: () => any }>
export type Json = Exclude<Rows[number], Row>
