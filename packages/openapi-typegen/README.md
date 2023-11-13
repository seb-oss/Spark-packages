# `@sebspark/openapi-typegen`

Generates types and a routerdefinition from OpenAPI specs

## Usage

This is an example assuming that you have one schema, `marketdata.json`. The name
of this file will be used to generate Server and Client names.

This example can be found in [@sebspark/openapi-e2e](../packages/openapi-e2e)

```zsh
yarn openapi-typegen -i ./src/schemas/marketdata.json -o ./src/schemas/
```

The schema will export all types defined in the OpenAPI spec as well as:

`MarketdataAPIServer` - a server definition meant to be used with [@sebspark/openapi-express](./packages/openapi-express)

`MarketDataAPIClient` - a client definition meant to be used with [@sebspark/openapi-client](./packages/openapi-client)
