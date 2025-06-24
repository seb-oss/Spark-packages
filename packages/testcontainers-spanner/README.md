# @sebspark/testcontainers-spanner

A Testcontainers-based wrapper for the Cloud Spanner emulator, enabling easy end-to-end testing of Google Cloud Spanner in your Node.js projects.

---

## Features

* **Containerized Spanner Emulator**
  Launches the official Google Cloud Spanner emulator Docker image via Testcontainers.
* **Environment Configuration**
  Automatically sets up `SPANNER_EMULATOR_HOST` and `GOOGLE_CLOUD_PROJECT` for you.
* **Convenience Methods**
  High- and low-level helpers to create/delete Spanner instances and databases.
* **Lightweight & Disposable**
  Emulators spin up in memory and tear down cleanly after tests.

---

## Table of Contents

* [Installation](#installation)
* [Prerequisites](#prerequisites)
* [Getting Started](#getting-started)
* [API Reference](#api-reference)

  * [SpannerEmulatorContainer](#spanemeremulatorcontainer)
  * [StartedSpannerEmulatorContainer](#startedspanemeremulatorcontainer)
* [Example Usage](#example-usage)

  * [Basic Flow](#basic-flow)
  * [Vitest E2E Tests](#vitest-e2e-tests)
* [Configuration](#configuration)

---

## Installation

```bash
npm install --save-dev @sebspark/testcontainers-spanner testcontainers
```

## Prerequisites

* **Docker**: Ensure the Docker daemon is running locally.
* **Node.js**: v14+ recommended.
* **Testcontainers**: This module builds on `testcontainers` for Node.js.

---

## Getting Started

1. **Import the container**:

   ```ts
   import { SpannerEmulatorContainer } from '@sebspark/testcontainers-spanner'
   ```

2. **Start and stop**:

   ```ts
   const emulator = await new SpannerEmulatorContainer().start()
   // ... run your tests against emulator ...
   await emulator.stop()
   ```

The emulator listens on two ports:

* **gRPC**: (default exposed port `9010`) — used by the Node.js client library.
* **HTTP/REST**: (default exposed port `9020`) — for REST calls or debugging.

---

## API Reference

### `SpannerEmulatorContainer`

A Testcontainers `GenericContainer` wrapper for the Spanner emulator.

| Method                                              | Description                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `constructor(image?: string)`                       | Optionally specify a Docker image (defaults to `gcr.io/cloud-spanner-emulator/emulator`). |
| `start(): Promise<StartedSpannerEmulatorContainer>` | Launches the container and returns a helper wrapper.                                      |
| `withExposedPorts(...)`                             | (Inherited) Customize ports if needed.                                                    |

### `StartedSpannerEmulatorContainer`

Methods to interact with the running emulator.

| Property / Method                                                 | Description                                                       |
| ----------------------------------------------------------------- | ----------------------------------------------------------------- |
| `instanceConfig: string`                                          | Resource name of the built-in emulator config (`emulator-config`) |
| `getEmulatorGrpcEndpoint(): string`                               | Returns `host:port` for gRPC; sets `SPANNER_EMULATOR_HOST`.       |
| `getEmulatorHttpEndpoint(): string`                               | Returns `host:port` for HTTP REST endpoint.                       |
| `createInstance(id: string, options?: IInstance): Promise<any>`   | Creates a Spanner instance (low-level API).                       |
| `deleteInstance(id: string): Promise<void>`                       | Deletes an instance (high-level API).                             |
| `createDatabase(instanceId: string, dbId: string): Promise<any>`  | Creates a database under an existing instance.                    |
| `deleteDatabase(instanceId: string, dbId: string): Promise<void>` | Deletes a database (high-level API).                              |

---

## Example Usage

### Basic Flow

```ts
import { SpannerEmulatorContainer } from '@sebspark/testcontainers-spanner'
import { Spanner } from '@google-cloud/spanner'

const PROJECT_ID = 'test-project'

async function main() {
  const emulator = await new SpannerEmulatorContainer().start()
  const spanner = new Spanner({ projectId: PROJECT_ID })

  // Create instance & database
  await emulator.createInstance('my-instance', { nodeCount: 1 })
  await emulator.createDatabase('my-instance', 'my-db')

  // Use the database...

  // Cleanup
  await emulator.deleteDatabase('my-instance', 'my-db')
  await emulator.deleteInstance('my-instance')
  await emulator.stop()
}

main().catch(console.error)
```

### Vitest E2E Tests

```ts
import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import { PROJECT_ID, SpannerEmulatorContainer } from '@sebspark/testcontainers-spanner'
import { Spanner } from '@google-cloud/spanner'

let emulator, spanner

describe('Spanner E2E', () => {
  beforeAll(async () => {
    emulator = await new SpannerEmulatorContainer().start()
    spanner = new Spanner({ projectId: PROJECT_ID })
  })

  afterAll(async () => {
    await emulator.stop()
  })

  it('creates and deletes a database', async () => {
    await emulator.createInstance('inst1')
    await emulator.createDatabase('inst1', 'db1')
    await spanner.instance('inst1').database('db1').runTransaction(t => t.executeSql('SELECT 1'))
    await emulator.deleteDatabase('inst1', 'db1')
    await emulator.deleteInstance('inst1')
  })
})
```

---

## Configuration

| Environment Variable    | Purpose                                              |
| ----------------------- | ---------------------------------------------------- |
| `GOOGLE_CLOUD_PROJECT`  | Google Cloud project ID (defaults to `test-project`) |
| `SPANNER_EMULATOR_HOST` | Set by container to point gRPC client to emulator    |
