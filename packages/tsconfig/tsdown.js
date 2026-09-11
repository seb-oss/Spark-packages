import { defineConfig } from 'tsdown'

/** @type {import('tsdown').UserConfig} */
const userConfig = {
  format: ['esm'],
  platform: 'node',
  target: 'node24',
  // tsgo (auto-selected under TypeScript 7) writes .d.ts next to source for
  // any cross-package import: https://github.com/rolldown/tsdown/issues/1048
  dts: { generator: 'tsc' },
  sourcemap: true,
  clean: true,
  inputOptions: {
    checks: {
      eval: false,
    },
  },
}

export default defineConfig(userConfig)
