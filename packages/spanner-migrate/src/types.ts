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
