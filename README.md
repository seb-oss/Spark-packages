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

Packages are added in two steps; running the appropriate nx generator and running the `sparkify` plugin to ensure the newly added package has a valid `package.json`.

```shell
# This example created a package @sebspark/meow
yarn nx generate @nx/node:library meow --publishable --importPath=@sebspark/meow --no-interactive
yarn ensure meow
```
