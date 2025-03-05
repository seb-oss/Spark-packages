import baseConfig from './jest.config'

export default {
  ...baseConfig,
  testMatch: ['**/*.e2e.ts'], // Only include E2E test files
  testTimeout: 120000, // Set higher timeout (30 seconds in this case),
  maxWorkers: 1, // Run tests sequentially (only 1 worker)
  displayName: '@sebspark/spanner-migrate:e2e',
}
