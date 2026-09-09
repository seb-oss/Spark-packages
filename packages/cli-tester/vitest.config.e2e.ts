import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
    // These tests spawn real child processes and wait on their stdout, so
    // latency depends on OS scheduling. Under full-monorepo load (many
    // parallel turbo tasks), the default 5000ms timeout has no margin over
    // COMMAND_TIMEOUT and becomes flaky.
    testTimeout: 20000,
  },
})
