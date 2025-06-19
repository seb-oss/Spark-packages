# SEB Spark

Public packages published under the [@sebspark](https://www.npmjs.com/org/sebspark) organisation on NPM.

## Packages

### [@sebspark/logging](./packages/logging/)

A pubsub subscriber helper.

### [@sebspark/pubsub](./packages/pubsub/)

A wrapper around Google PubSub adding support for typing, serialization/deserialization, naming of subscriptions for specific topics, push routes and some more.

### [@sebspark/typed-router](./packages/typed-router/)

An Express router wrapped with additional TypeScript typings and defintions for our purposes.

### [@sebspark/tsconfig](./packages/tsconfig)

Default TypeScript configuration

### [@sebspark/iso-10383](./packages/iso-10383)

ISO-10383 Market Identification Codes (MIC).

### [@sebspark/iso-4217](./packages/iso-4217)

ISO-4217 currency codes.

### [@sebspark/avsc-ts](./packages/avsc-ts)

Generates Typescript from avro files

### [@sebspark/avsc-isometric](./packages/avsc-isometric)

A stripped down version of avsc which works in node, browser and react-native

### [@sebspark/openapi-typegen](./packages/openapi-typegen)

Generates types and a routerdefinition from OpenAPI specs

### [@sebspark/openapi-express](./packages/openapi-express)

A typed router for express based on type definitions from openapi-typegen

### [@sebspark/openapi-core](./packages/openapi-core)

Base types for OpenAPI/Typescript

### [@sebspark/openapi-client](./packages/openapi-client)

A typed REST client for the definitions from openapi-typegen

### [@sebspark/openapi-e2e](./packages/openapi-e2e)

End to end tests for openapi generator, express and client

### [@sebspark/retry](./packages/retry)

A helper for retrying any promise call (ex an http request) with error rules and backoff

### [@sebspark/opensearch](./packages/opensearch)

A wrapper for OpenSearch Client to assist with typed queries, indices etc

### [@sebspark/promise-cache](./packages/promise-cache)

A simple caching wrapper for promises.

### [@sebspark/trading-hours](./packages/trading-hours)

Find trading hours of a market, when it&#x27;s closed for holidays, or when it&#x27;s only open for part of the day.

### [@sebspark/tracing](./packages/tracing)

Use Opentelemetry for collecting traces and exporting to Cloud Trace

### [@sebspark/gcp-iam](./packages/gcp-iam)

Google IAM utilities.

### [@sebspark/spanner-mock](./packages/spanner-mock)

A (so far incomplete) mocking library for Spanner DB

### [@sebspark/spanner-migrate](./packages/spanner-migrate)

Migration tool for Spanner DB

### [@sebspark/cli-tester](./packages/cli-tester)

A wrapper for child_process spawn to simplify interactive cli tests

### [@sebspark/openapi-auth-iam](./packages/openapi-auth-iam)

Token generator and refresh functions for OpenApi Client and Google IAM.

### [@sebspark/tradeinsight](./packages/tradeinsight)

Trade Insight client library with helps

### [@sebspark/socket.io-gcp-pubsub-emitter](./packages/socket.io-gcp-pubsub-emitter)

A Socket.IO PubSub emitter, allowing to communicate with a group of Socket.IO servers from another Node.js process

<!--NEW_PACKAGE-->

## Contributing

### Get started

Install dependencies with `yarn`.

```
yarn
```

Run TypeScript for all packages in watch mode using `yarn dev` or a specific package using the [filter flag](https://turbo.build/repo/docs/core-concepts/monorepos/filtering), e.g., `yarn dev --filter logging`. Additional scripts for testing, linting, and building can be found in `package.json`.

### Adding a new package

We use [Turborepo's code generation](https://turbo.build/repo/docs/core-concepts/monorepos/code-generation) to create new packages. Run the following command, provide it with information, and it will create a package with some default scripts and TypeScript configured.

```shell
yarn generate:package
```

### Install dependencies to package

We use Yarn [workspaces](https://classic.yarnpkg.com/lang/en/docs/workspaces/). To install a dependency to a specific workspace (package) use, for instance, `yarn workspace @sebspark/logging add @types/jest`. Note that the workspace name is the `name` defined in `package.json`, not the folder name.
