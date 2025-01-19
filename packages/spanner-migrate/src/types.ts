export type Migration = {
  id: string
  description: string
  up: string
  down: string
  appliedAt?: Date
}

export type Config = {
  migrationsPath: string
  instanceName: string
  databaseName: string
  projectId?: string
}
