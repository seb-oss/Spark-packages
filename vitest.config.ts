import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      exclude: ['**/*.e2e.ts', '**/dist/*'], // Excludes E2E tests from coverage
    },
  },
})
