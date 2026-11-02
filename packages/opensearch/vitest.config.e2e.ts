import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.e2e.ts'],
    testTimeout: 60000,
    // Hooks start containers, which pull the image first after it is updated
    hookTimeout: 300_000,
    sequence: {
      concurrent: false,
      shuffle: false,
    },
  },
})
