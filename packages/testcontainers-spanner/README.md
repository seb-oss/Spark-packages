# @sebspark/testcontainers-spanner

> ⚠️ **DEPRECATED**  
> This package has been donated to the Testcontainers organization.  
> **Please switch to [`@testcontainers/gcloud`](https://www.npmjs.com/package/@testcontainers/gcloud).**

---

## 🚀 Install the new package

```bash
npm uninstall @sebspark/testcontainers-spanner
npm install @testcontainers/gcloud
```

or with Yarn:

```bash
yarn remove @sebspark/testcontainers-spanner
yarn add @testcontainers/gcloud
```

---

## 🔄 Migration guide

If you were previously doing:

```ts
import { SpannerEmulatorContainer } from '@sebspark/testcontainers-spanner'

const emulator = await new SpannerEmulatorContainer().start()

// create instance and database
await emulator.createInstance('my-instance', { nodeCount: 1 })
await emulator.createDatabase('my-instance', 'my-db')

// ... run your tests against emulator ...

// delete instance and database
await emulator.deleteDatabase('my-instance', 'my-db')
await emulator.deleteInstance('my-instance')

await emulator.stop()
```

update to:

```ts
import { SpannerEmulatorContainer, SpannerEmulatorHelper } from '@google-cloud/spanner'

// Image name required
const emulator = await new SpannerEmulatorContainer('gcr.io/cloud-spanner-emulator/emulator').start()
const helper = new SpannerEmulatorHelper(container)

// Enable emulation for single instance testing
process.env.SPANNER_EMULATOR_HOST = container.getEmulatorGrpcEndpoint()

// create instance and database
await helper.createInstance('my-instance', { nodeCount: 1 })
await helper.createDatabase('my-instance', 'my-db')

// ... run your tests against emulator ...

// delete instance and database
await helper.deleteDatabase('my-instance', 'my-db')
await helper.deleteInstance('my-instance')

await emulator.stop()
```

Everything else (methods, lifecycle hooks, etc.) remains identical — just replace the package name and class.

---

## 📚 Documentation

For full docs, examples and API reference, please see the official Testcontainers repo:

- https://node.testcontainers.org/modules/gcloud/#cloud-spanner
- https://github.com/testcontainers/testcontainers-node/tree/main/modules/gcloud

---

> _Thank you for using this library. If you have questions or run into issues, please open them over in the Testcontainers org!_
