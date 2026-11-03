---
"@sebspark/otel": major
---

**Breaking:** `@sebspark/opentelemetry-instrumentation-opensearch` and `@opensearch-project/opensearch` are now optional peer dependencies. `@sebspark/otel` no longer installs them, and applications that don't use OpenSearch no longer get an unmet-peer warning for `@opensearch-project/opensearch`.

**Who needs to act:**

Only applications that call `instrumentations.opensearch()`. Check with:

```sh
grep -rn "instrumentations.opensearch" . --exclude-dir=node_modules --exclude-dir=dist
```

No match: upgrade without changes.

**What to do:**

Before upgrading to 5.0.0, add both packages to your application's `dependencies`:

```sh
yarn add @sebspark/opentelemetry-instrumentation-opensearch @opensearch-project/opensearch
# or
npm install @sebspark/opentelemetry-instrumentation-opensearch @opensearch-project/opensearch
# or
pnpm add @sebspark/opentelemetry-instrumentation-opensearch @opensearch-project/opensearch
```

Supported versions: `@sebspark/opentelemetry-instrumentation-opensearch@^0.4.2` and `@opensearch-project/opensearch@>=2`.

With Yarn, also add `@opentelemetry/api@1.10.0`. The instrumentation has it as a peer dependency, and Yarn expects your application to provide it. With Plug'n'Play (`nodeLinker: pnp`, the Yarn default) the instrumentation fails to load without it; with `nodeLinker: node-modules` it removes a peer warning:

```sh
yarn add @opentelemetry/api@1.10.0
```

**What happens if you don't:**

Typecheck, lint and unit tests still pass. `initialize()` rejects at runtime with:

```
Error: OpenSearch instrumentation could not be loaded. Install @sebspark/opentelemetry-instrumentation-opensearch and @opensearch-project/opensearch (with Yarn PnP also @opentelemetry/api@1.10.0). See https://github.com/seb-oss/Spark-packages/tree/main/packages/otel#opensearch-optional-peer-dependencies
```

The `cause` of the error names the module that could not be found. When otel is loaded with `node --import`, the service does not start.

4.3.0 and 4.3.1 contained the same change by mistake, released as a minor. 4.3.2 reverted it.
