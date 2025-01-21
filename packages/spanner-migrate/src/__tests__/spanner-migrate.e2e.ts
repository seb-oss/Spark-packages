jest.unmock('@google-cloud/spanner')

import { execSync } from 'node:child_process'
import {
  constants,
  access,
  readFile,
  readdir,
  rm,
  rmdir,
} from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Readable } from 'node:stream'
import { inspect } from 'node:util'
import { type Database, type Instance, Spanner } from '@google-cloud/spanner'
import {
  GenericContainer,
  type StartedTestContainer,
  Wait,
} from 'testcontainers'

import { create, down, init, status, up } from '..'
import type { Config } from '../types'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('spanner-migrate', () => {
  let config: Config
  let spannerContainer: StartedTestContainer
  let spannerClient: Spanner
  let instance: Instance
  let database: Database

  const configPath = '.spanner-migrate.config.json'

  beforeAll(async () => {
    config = {
      databaseName: 'test-instance',
      instanceName: 'test-database',
      migrationsPath: './src/__tests__/e2e/migrations',
      projectId: 'spanner-migrate-e2e',
    }

    const logConsumer = (stream: Readable) => {
      stream
        .on('data', (chunk) => {
          process.stdout.write(chunk)
        })
        .on('error', (error) => {
          process.stderr.write(inspect(error, false, 1000, true))
        })
    }

    // Start the Spanner emulator container
    console.log('Starting Spanner container')
    spannerContainer = await new GenericContainer(
      'gcr.io/cloud-spanner-emulator/emulator:latest'
    )
      .withExposedPorts(9010, 9020)
      .withStartupTimeout(120000)
      .withLogConsumer(logConsumer)
      .withWaitStrategy(
        Wait.forLogMessage(/gRPC server listening at 0.0.0.0:9010/gi)
      )
      .start()

    const emulatorHost = 'localhost'
    const grpcPort = spannerContainer.getMappedPort(9010)
    const restPort = spannerContainer.getMappedPort(9020)

    // Set up host
    execSync('gcloud config configurations create spanner-emulator')
    execSync('gcloud config configurations activate spanner-emulator')
    execSync('gcloud config set auth/disable_credentials true')
    execSync(`gcloud config set project ${config.projectId}`)
    execSync(
      `gcloud config set api_endpoint_overrides/spanner http://${emulatorHost}:${restPort}/`
    )

    process.env.SPANNER_EMULATOR_HOST = `${emulatorHost}:${grpcPort}`

    // Try to connect
    execSync('gcloud spanner instances list')

    // Set up instance and database
    execSync(
      `gcloud spanner instances create ${config.instanceName} --config=emulator-config --description="Test Instance" --nodes=1`
    )
    execSync(
      `gcloud spanner databases create ${config.databaseName} --instance=${config.instanceName}`
    )

    // Set up Spanner client to connect to emulator
    spannerClient = new Spanner({
      projectId: config.projectId,
    })

    // Create an instance and a database
    instance = spannerClient.instance(config.instanceName)
    database = instance.database(config.databaseName)
  })
  afterAll(async () => {
    await spannerContainer.stop()

    execSync('gcloud config configurations activate default')
    await wait(1000)
    execSync('gcloud config configurations delete spanner-emulator --quiet')
  })
  it('starts', () => {
    expect(true).toBe(true)
  })
  describe('init', () => {
    afterEach(async () => {
      await rm(`./${configPath}`)
    })
    it('creates a config file', async () => {
      await init(config, configPath)

      expect(access(resolve(configPath), constants.F_OK)).resolves.not.toThrow()
    })
    it('sets correct properties', async () => {
      await init(config, configPath)
      const configFile = await readFile(configPath, 'utf8')

      expect(JSON.parse(configFile)).toEqual(config)
    })
  })
  describe('create', () => {
    const migrationsPath = './src/__tests__/e2e/create-migrations'
    beforeEach(async () => {
      config.migrationsPath = migrationsPath
      await init(config, configPath)
    })
    afterEach(async () => {
      await rm(`./${configPath}`)
      await rmdir(migrationsPath, { recursive: true })
    })
    it('creates a migration file', async () => {
      await create(config, 'This is a Test migration')

      const files = await readdir(resolve(config.migrationsPath))
      expect(files).toHaveLength(1)
      expect(files[0]).toMatch(/^\d{17}_this_is_a_test_migration.ts$/)
    })
  })
  describe('up/status/down', () => {
    beforeEach(async () => {
      config.migrationsPath = './src/__tests__/e2e/migrations'
      await init(config, configPath)
    })
    afterEach(async () => {
      await rm(`./${configPath}`)
    })
    it('runs a single migration up and down', async () => {
      await up(config, 1)

      let schema = await database.getSchema()
      expect(schema[0]).toHaveLength(2)
      expect(schema[0][1]).toMatch(/CREATE TABLE users/gi)

      let migrationStatus = await status(config)
      expect(migrationStatus).toMatch(
        /Applied\n--------------------------------------------------------------------------------\n20250120145638000_create_table_users/
      )
      expect(migrationStatus).toMatch(
        /New\n--------------------------------------------------------------------------------\n20250121144738000_create_table_and_index_adresses/
      )

      await down(config)
      schema = await database.getSchema()
      expect(schema[0]).toHaveLength(1)

      migrationStatus = await status(config)
      expect(migrationStatus).toMatch(
        /Applied\n--------------------------------------------------------------------------------\n/
      )
      expect(migrationStatus).toMatch(
        /New\n--------------------------------------------------------------------------------\n20250120145638000_create_table_users\n20250121144738000_create_table_and_index_adresses/
      )
    })
    it('runs a multiple migrations up and down', async () => {
      // Up all
      await up(config)

      let schema = await database.getSchema()
      expect(schema[0]).toHaveLength(4)
      expect(schema[0][2]).toMatch(/CREATE TABLE addresses/gi)
      expect(schema[0][3]).toMatch(/CREATE INDEX idx_addresses_user_id/gi)

      let migrationStatus = await status(config)
      migrationStatus = await status(config)
      expect(migrationStatus).toMatch(
        /Applied\n--------------------------------------------------------------------------------\n20250120145638000_create_table_users\n20250121144738000_create_table_and_index_adresses/
      )
      expect(migrationStatus).toMatch(
        /New\n--------------------------------------------------------------------------------\n/
      )

      // Down one
      await down(config)
      schema = await database.getSchema()
      expect(schema[0]).toHaveLength(2)

      migrationStatus = await status(config)
      migrationStatus = await status(config)
      expect(migrationStatus).toMatch(
        /Applied\n--------------------------------------------------------------------------------\n20250120145638000_create_table_users\n/
      )
      expect(migrationStatus).toMatch(
        /New\n--------------------------------------------------------------------------------\n20250121144738000_create_table_and_index_adresses/
      )

      // Down one
      await down(config)
      schema = await database.getSchema()
      expect(schema[0]).toHaveLength(1)

      migrationStatus = await status(config)
      migrationStatus = await status(config)
      expect(migrationStatus).toMatch(
        /Applied\n--------------------------------------------------------------------------------\n/
      )
      expect(migrationStatus).toMatch(
        /New\n--------------------------------------------------------------------------------\n20250120145638000_create_table_users\n20250121144738000_create_table_and_index_adresses/
      )
    })
  })
})
