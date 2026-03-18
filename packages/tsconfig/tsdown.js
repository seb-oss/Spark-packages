import { defineConfig } from 'tsdown'

/** @type {import('tsdown').UserConfig} */
const userConfig = {
  format: ['esm'],
  platform: 'node',
  target: 'node24',
  dts: true,
  sourcemap: true,
  clean: true,
  inputOptions: {
    checks: {
      eval: false,
    },
  },
}

export default defineConfig(userConfig)
