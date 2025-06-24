import { Spanner } from '@google-cloud/spanner'
import type { IInstance } from '@google-cloud/spanner/build/src/instance'
import {
  AbstractStartedContainer,
  GenericContainer,
  type StartedTestContainer,
  Wait,
} from 'testcontainers'

// Default emulator Docker image and ports
const DEFAULT_IMAGE_NAME = 'gcr.io/cloud-spanner-emulator/emulator'
const GRPC_PORT = 9010
const HTTP_PORT = 9020

export const PROJECT_ID = 'test-project'
process.env.GOOGLE_CLOUD_PROJECT = PROJECT_ID // Ensure the emulator client picks up the test project

/**
 * SpannerEmulatorContainer wraps the Cloud Spanner emulator in a Testcontainers GenericContainer.
 * <p>
 * By default, it exposes 9010 for gRPC and 9020 for HTTP endpoints, matching the emulator defaults.
 * It waits until the emulator logs a ready message and applies a startup timeout to avoid hanging.
 */
export class SpannerEmulatorContainer extends GenericContainer {
  constructor(image = DEFAULT_IMAGE_NAME) {
    super(image)

    this.withExposedPorts(GRPC_PORT, HTTP_PORT)
      // Waits for the emulator to print "Cloud Spanner emulator running." to stdout
      .withWaitStrategy(
        Wait.forLogMessage(/.*Cloud Spanner emulator running\..*/, 1)
      )
      .withStartupTimeout(120_000) // 2 minutes: ensures tests fail if startup stalls
  }

  /**
   * Starts the container and returns a wrapper with helper methods for emulator operations.
   */
  public override async start(): Promise<StartedSpannerEmulatorContainer> {
    const started = await super.start()
    return new StartedSpannerEmulatorContainer(started)
  }
}

/**
 * Provides convenience methods to interact with the running emulator:
 * - Automatically configures SPANNER_EMULATOR_HOST
 * - Creates and deletes instances and databases
 */
export class StartedSpannerEmulatorContainer extends AbstractStartedContainer {
  private readonly client: Spanner

  public readonly instanceConfig: string

  /**
   * @param startedTestContainer - the Testcontainers wrapper for the running emulator
   */
  constructor(startedTestContainer: StartedTestContainer) {
    super(startedTestContainer)

    // Point the Spanner client at our emulator's gRPC endpoint
    process.env.SPANNER_EMULATOR_HOST = this.getEmulatorGrpcEndpoint()

    // Initialize a Spanner client; projectId is read from GOOGLE_CLOUD_PROJECT
    this.client = new Spanner({ projectId: PROJECT_ID })

    // Set instanceConfig
    this.instanceConfig = this.client
      .getInstanceAdminClient()
      .instanceConfigPath(PROJECT_ID, 'emulator-config')
  }

  /**
   * Returns the emulator gRPC endpoint in host:port form, e.g. "localhost:49153".
   * This value is set to SPANNER_EMULATOR_HOST so the client library disables TLS and
   * routes all gRPC calls to the emulator.
   */
  public getEmulatorGrpcEndpoint(): string {
    return `${this.getHost()}:${this.getMappedPort(GRPC_PORT)}`
  }

  /**
   * Returns the emulator HTTP REST endpoint in host:port form, e.g. "localhost:49154".
   * Useful for debugging or using the emulator's REST API directly.
   */
  public getEmulatorHttpEndpoint(): string {
    return `${this.getHost()}:${this.getMappedPort(HTTP_PORT)}`
  }

  /**
   * Creates a Spanner instance in the emulator using the low-level InstanceAdminClient.
   * @param instanceId - the ID of the instance to create
   * @param options - optional configuration (node count, display name, config)
   * @returns the created instance metadata
   */
  public async createInstance(instanceId: string, options?: IInstance) {
    const instanceAdminClient = this.client.getInstanceAdminClient()
    const [operation] = await instanceAdminClient.createInstance({
      instanceId,
      parent: instanceAdminClient.projectPath(PROJECT_ID),
      instance: options,
    })
    // Emulators return a long-running operation; await its completion
    const [result] = await operation.promise()
    return result
  }

  /**
   * Deletes a Spanner instance using the high-level client helper.
   * @param instanceId - the ID of the instance to delete
   */
  public async deleteInstance(instanceId: string) {
    // High-level client constructs the full resource path and performs the call
    await this.client.instance(instanceId).delete()
  }

  /**
   * Creates a database under the given instance using the low-level DatabaseAdminClient.
   * @param instanceId - the ID of the parent instance
   * @param databaseId - the ID of the database to create
   * @returns the created database metadata
   */
  public async createDatabase(instanceId: string, databaseId: string) {
    const instanceAdmin = this.client.getInstanceAdminClient()
    const databaseAdmin = this.client.getDatabaseAdminClient()

    const [operation] = await databaseAdmin.createDatabase({
      parent: instanceAdmin.instancePath(PROJECT_ID, instanceId),
      createStatement: `CREATE DATABASE \`${databaseId}\``,
    })
    // Wait for operation to complete before returning metadata
    const [result] = await operation.promise()
    return result
  }

  /**
   * Deletes a database using the high-level client helper for simplicity.
   * @param instanceId - the ID of the instance containing the database
   * @param databaseId - the ID of the database to delete
   */
  public async deleteDatabase(instanceId: string, databaseId: string) {
    // High-level client handles resource naming and delete call
    await this.client.instance(instanceId).database(databaseId).delete()
  }
}
