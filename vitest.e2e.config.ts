import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      '**/*.e2e.ts', // Include e2e tests
    ],
    exclude: [
      '**/*.spec.ts', // Exclude regular tests
      '**/*.test.ts', // Exclude regular tests
    ],
    // E2E tests often need more time for containers, HTTP calls, etc.
    testTimeout: 30000,
    hookTimeout: 30000,
    // If you want a separate environment (e.g. Node instead of jsdom):
    environment: 'node',
    // Optional: run E2E tests sequentially to avoid port conflicts
    sequence: {
      concurrent: false,
    },
  },
})
