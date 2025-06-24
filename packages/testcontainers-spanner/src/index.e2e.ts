import { Spanner } from '@google-cloud/spanner'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  PROJECT_ID,
  SpannerEmulatorContainer,
  type StartedSpannerEmulatorContainer,
} from '.'

// Constants for testing
const TIMEOUT = 120_000
const INSTANCE_ID = 'my-instance'
const DATABASE_ID = 'my-database'

// Will hold references to our emulator container and Spanner client
let emulator: StartedSpannerEmulatorContainer
let spanner: Spanner

describe('SpannerEmulatorContainer E2E Tests', () => {
  // Start the emulator once before all tests
  beforeAll(async () => {
    emulator = await new SpannerEmulatorContainer().start()
    spanner = new Spanner({ projectId: PROJECT_ID })
  }, TIMEOUT)

  // Stop the emulator after all tests complete
  afterAll(async () => {
    await emulator.stop()
  }, TIMEOUT)

  it('should start with no instances', async () => {
    const [instances] = await spanner.getInstances()
    expect(instances).toHaveLength(0)
  })

  it(
    'should create and list an instance',
    async () => {
      const configName = emulator.instanceConfig
      const instanceMeta = await emulator.createInstance(INSTANCE_ID, {
        config: configName,
        nodeCount: 1,
        displayName: 'Test Instance',
      })

      expect(instanceMeta).toHaveProperty('name')
      expect(instanceMeta.name).toEqual(
        `projects/${PROJECT_ID}/instances/${INSTANCE_ID}`
      )
      expect(instanceMeta.displayName).toEqual('Test Instance')

      const [instances] = await spanner.getInstances()
      const ids = instances.map((i) => i.id as string)
      expect(ids).toContain(`projects/${PROJECT_ID}/instances/${INSTANCE_ID}`)
    },
    TIMEOUT
  )

  it(
    'should create and list a database',
    async () => {
      const dbMeta = await emulator.createDatabase(INSTANCE_ID, DATABASE_ID)
      expect(dbMeta).toHaveProperty('name')
      expect(dbMeta.name).toEqual(
        `projects/${PROJECT_ID}/instances/${INSTANCE_ID}/databases/${DATABASE_ID}`
      )

      const [databases] = await spanner.instance(INSTANCE_ID).getDatabases()
      const dbIds = databases.map((db) => db.id)
      expect(dbIds).toContain(
        `projects/${PROJECT_ID}/instances/${INSTANCE_ID}/databases/${DATABASE_ID}`
      )
    },
    TIMEOUT
  )

  it(
    'should delete database and instance',
    async () => {
      await emulator.deleteDatabase(INSTANCE_ID, DATABASE_ID)
      const [afterDbs] = await spanner.instance(INSTANCE_ID).getDatabases()
      expect(afterDbs.map((d) => d.id)).not.toContain(DATABASE_ID)

      await emulator.deleteInstance(INSTANCE_ID)
      const [afterInstances] = await spanner.getInstances()
      expect(afterInstances.map((i) => i.id)).not.toContain(INSTANCE_ID)
    },
    TIMEOUT
  )

  it('should expose gRPC and HTTP endpoints', () => {
    const grpcEndpoint = emulator.getEmulatorGrpcEndpoint()
    const httpEndpoint = emulator.getEmulatorHttpEndpoint()
    expect(grpcEndpoint).toMatch(/^.+:\d+$/)
    expect(httpEndpoint).toMatch(/^.+:\d+$/)
    expect(process.env.SPANNER_EMULATOR_HOST).toEqual(grpcEndpoint)
  })

  it('should error when creating a database on a non-existent instance', async () => {
    await expect(
      emulator.createDatabase('no-such-instance', 'db')
    ).rejects.toThrow()
  })

  it('should error when creating a duplicate instance', async () => {
    await emulator.createInstance(INSTANCE_ID, { nodeCount: 1 })
    await expect(
      emulator.createInstance(INSTANCE_ID, { nodeCount: 1 })
    ).rejects.toThrow()
  })
})
