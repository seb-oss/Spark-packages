import { exec } from 'node:child_process'
import {
  GenericContainer,
  type StartedTestContainer,
  Wait,
} from 'testcontainers'

export const startSpanner = async (projectId: string) => {
  const container = await startContainer()
  await initDb(container, projectId)

  return container
}

const startContainer = async () => {
  const spannerContainer = await new GenericContainer(
    'gcr.io/cloud-spanner-emulator/emulator:latest'
  )
    .withExposedPorts(9010, 9020)
    .withStartupTimeout(120000)
    // .withLogConsumer(logConsumer)
    .withWaitStrategy(
      Wait.forLogMessage(/gRPC server listening at 0.0.0.0:9010/gi)
    )
    .start()

  return spannerContainer
}

const initDb = async (container: StartedTestContainer, projectId: string) => {
  const grpcPort = container.getMappedPort(9010)
  const restPort = container.getMappedPort(9020)

  // Set up host
  await execAsync('gcloud config configurations create spanner-emulator')
  await execAsync('gcloud config configurations activate spanner-emulator')
  await execAsync('gcloud config set auth/disable_credentials true')
  await execAsync(`gcloud config set project ${projectId}`)
  await execAsync(
    `gcloud config set api_endpoint_overrides/spanner http://localhost:${restPort}/`
  )

  process.env.SPANNER_EMULATOR_HOST = `localhost:${grpcPort}`

  // Try to connect
  await execAsync('gcloud spanner instances list')
}

export const createInstance = async (instanceName: string) => {
  await execAsync(
    `gcloud spanner instances create ${instanceName} --config=emulator-config --description="Test Instance" --nodes=1`
  )
}

export const createDatabase = async (
  instanceName: string,
  databaseName: string
) => {
  await execAsync(
    `gcloud spanner databases create ${databaseName} --instance=${instanceName}`
  )
}

const execAsync = (command: string) =>
  new Promise<Buffer>((resolve, reject) => {
    const childProcess = exec(command, (error) => {
      if (error) {
        reject(error)
      }
    })
    const chunks: Buffer[] = []
    childProcess.on('data', (chunk) => {
      chunks.push(chunk)
    })
    childProcess.on('error', (error) => {
      reject(error)
    })
    childProcess.on('exit', (_code) => {
      resolve(Buffer.concat(chunks))
    })
  })

export type StatusEntry = {
  database: string
  applied: string[]
  new: string[]
}

export const parseStatus = (text: string): StatusEntry[] => {
  const databaseBlocks = splitDatabases(text)

  return databaseBlocks.map(parseDatabaseBlock).filter(Boolean) as StatusEntry[]
}

const splitDatabases = (text: string): string[] => {
  // Ensure we properly split between database sections
  return text
    .split(/\n\s*\nMigrations \[/)
    .map(
      (block, index) => (index === 0 ? block : `Migrations [${block}`) // Add back "Migrations [" for subsequent blocks
    )
    .filter(Boolean)
}

const parseDatabaseBlock = (block: string): StatusEntry | undefined => {
  const lines = block
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (!lines[0].startsWith('Migrations [')) return undefined

  const database = extractDatabaseName(lines[0])
  const applied = extractMigrations(lines, 'Applied')
  const newMigrations = extractMigrations(lines, 'New')

  return { database, applied, new: newMigrations }
}

const extractDatabaseName = (line: string): string => {
  const match = line.match(/^Migrations \[(.+?)\]$/)
  if (!match) throw new Error(`Failed to parse database name in: "${line}"`)
  return match[1]
}

const extractMigrations = (
  lines: string[],
  sectionHeader: string
): string[] => {
  const startIndex = lines.findIndex((line) => line === sectionHeader)
  if (startIndex === -1) return []

  const nextHeaderIndex = lines
    .slice(startIndex + 1)
    .findIndex((line) => line === 'New' || line === 'Applied')
  const endIndex =
    nextHeaderIndex !== -1 ? startIndex + 1 + nextHeaderIndex : lines.length

  return lines
    .slice(startIndex + 2, endIndex)
    .filter((line) => !line.startsWith('-'))
}
