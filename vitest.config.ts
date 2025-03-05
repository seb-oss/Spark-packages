import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        '**/*.e2e.ts', // Excludes E2E tests
        '**/__scaffold__/*', // Excludes test scaffolding code
        '**/dist/*', // Excludes built files
      ],
    },
  },
})
