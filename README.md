# SEB Spark

## Packages

### [@sebspark/logging](./packages/logging/)

A pubsub subscriber helper.

### [@sebspark/pubsub](./packages/pubsub/)

A wrapper around Google PubSub adding support for typing, serialization/deserialization, naming of subscriptions for specific topics, push routes and some more.

### [@sebspark/typed-router](./packages/typed-router/)

An Express router wrapped with additional TypeScript typings and defintions for our purposes.

<!--NEW_PACKAGE-->

## Contributing

### Adding a new package

We use [Turborepo's code generation](https://turbo.build/repo/docs/core-concepts/monorepos/code-generation) to create new packages. Run the following command, provide it with information, and it will create a package with some default scripts and TypeScript configured.

```shell
npm run generate:package
```
