import baseConfig from './jest.config'

export default {
  ...baseConfig,
  testMatch: ['**/*.e2e.ts'], // Only include E2E test files
  testTimeout: 120000, // Set higher timeout (30 seconds in this case)
  displayName: '@sebspark/spanner-migrate:e2e',
}
