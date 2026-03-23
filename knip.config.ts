import type { KnipConfig } from 'knip'

const baseEntry = [
  'src/index.{ts,js,mjs}!',
  'src/**/*.{spec,test}.ts!',
  'tsdown.config.ts!',
]

const baseProject = [
  'src/**/*.{ts,tsx,js,mjs,cjs}!',
  '!**/__tests__/**!',
  '!**/__scaffold__/**!',
]

const config: KnipConfig = {
  workspaces: {
    // Default for all packages
    'packages/*': {
      entry: baseEntry,
      project: baseProject,
    },

    // Packages with CLI entry points
    'packages/avsc-ts': {
      entry: [...baseEntry, 'src/cli.ts!'],
    },
    'packages/spanner-migrate': {
      entry: [
        ...baseEntry,
        'src/cli.ts!',
        'src/__tests__/**/*.{ts,js}!',
        'migrations/**/*.ts!',
      ],
    },

    // Package with scaffold fixtures
    'packages/cli-tester': {
      entry: [...baseEntry, 'src/__scaffold__/**/*.{ts,js,mjs}!'],
    },

    // Packages with __tests__ generated fixtures
    'packages/openapi-typegen': {
      entry: [...baseEntry, 'src/__tests__/**/*.{ts,js}!'],
    },

    // Packages with e2e tests
    'packages/promise-cache': {
      entry: [...baseEntry, 'src/**/*.e2e.ts!'],
    },
    'packages/test-iap': {
      entry: [...baseEntry, 'src/**/*.e2e.ts!'],
    },

    // No index.ts — multiple top-level exports
    'packages/socket.io-avro': {
      entry: [
        ...baseEntry,
        'src/client.ts!',
        'src/server.ts!',
        'src/common.ts!',
        'src/parser.ts!',
        'src/__tests__/**/*.{ts,js}!',
      ],
    },

    // No index.ts — e2e service package
    'packages/openapi-e2e': {
      entry: [...baseEntry, 'src/server.ts!'],
    },
  },

  ignoreWorkspaces: ['packages/avsc-isometric', 'packages/avsc-ts', 'packages/tsconfig', 'turbo'],
  ignoreDependencies: ['@turbo/gen', '@google-cloud/spanner', 'avsc'],
  ignoreBinaries: ['generate'],

  // All packages are public libraries — exported symbols are intentional public API
  exclude: ['exports', 'types', 'enumMembers'],
}

export default config
