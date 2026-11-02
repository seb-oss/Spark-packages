import type { KnipConfig } from 'knip'

const project = [
  'src/**/*.{ts,tsx,js,mjs,cjs}!',
  '!**/__tests__/**!',
  '!**/__scaffold__/**!',
]

/**
 * Knip's default entries (`src/index.ts`, `src/cli.ts`, package.json) apply
 * unless `entry` is given, so overrides must list `src/index.ts` themselves.
 * The vitest plugin does not know `*.spec-d.ts` type tests.
 */
const workspace = (entry?: string[]) => ({
  ...(entry && { entry }),
  project,
  vitest: { entry: ['src/**/*.{spec,test,spec-d}.ts'] },
})

const config: KnipConfig = {
  ignore: ['**/dist/**'],
  workspaces: {
    'packages/*': workspace(),
    'packages/spanner-migrate': workspace([
      'src/{index,cli}.ts!',
      'src/__tests__/**/*.{ts,js}',
      'migrations/**/*.ts',
    ]),
    'packages/cli-tester': workspace([
      'src/index.ts!',
      'src/__scaffold__/**/*.{ts,js,mjs}',
    ]),
    'packages/openapi-typegen': workspace([
      'src/index.ts!',
      'src/__tests__/**/*.{ts,js}',
    ]),
    // No index.ts — multiple top-level exports
    'packages/socket.io-avro': workspace([
      'src/{client,server,common,parser}.ts!',
      'src/__tests__/**/*.{ts,js}',
    ]),
    // No index.ts — e2e service package
    'packages/openapi-e2e': workspace(['src/server.ts!']),
  },

  ignoreWorkspaces: [
    'packages/avsc-isometric',
    'packages/avsc-ts',
    'packages/tsconfig',
    'turbo',
  ],
  ignoreDependencies: ['@turbo/gen', '@google-cloud/spanner', 'avsc'],

  // All packages are public libraries — exported symbols are intentional public API
  exclude: ['exports', 'types', 'enumMembers'],
}

export default config
