import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/*.e2e.ts'],
    testTimeout: 60000,
    sequence: {
      concurrent: false,
      shuffle: false,
    },
  },
})
