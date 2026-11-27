# `@sebspark/tsconfig`

Shared TypeScript and build configuration for packages in this monorepo.

## tsconfig

Extend one of the base configs from your package's `tsconfig.json`:

```jsonc
{
  "extends": "@sebspark/tsconfig/tsconfig.lib.json",
  "include": ["."]
}
```

- **`tsconfig.lib.json`** — `module: esnext`, `moduleResolution: bundler`. Used by every published package in this repo.
- **`tsconfig.app.json`** — `module: nodenext`, `moduleResolution: nodenext`. Not currently used by any package here; available for a package whose module resolution needs to match Node's own `nodenext` behaviour instead of a bundler's.

Both extend `base.json`, which sets `target: ES2023`, `strict: true`, `declaration: true` and excludes `dist`, `build` and `node_modules`.

## Build

`spark-build` (the `bin` this package exposes) wraps [tsdown](https://github.com/rolldown/tsdown)'s CLI. Use it as a package's `build` script:

```jsonc
{
  "scripts": {
    "build": "spark-build src/index.ts"
  }
}
```

Pass tsdown CLI flags through, e.g. `spark-build src/index.ts --format=esm --format=cjs`.

## tsdown config

`./tsdown` exports a default tsdown config (ESM, Node 24 target, declarations, sourcemaps, a clean `dist` on each build). Extend it in a package's own `tsdown.config.ts` for options `spark-build`'s CLI flags don't cover:

```typescript
import config from '@sebspark/tsconfig/tsdown'

export default {
  ...config,
  failOnWarn: false,
}
```
