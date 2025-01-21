export default {
  displayName: '@sebspark/spanner-migrate',
  testEnvironment: 'node',
  passWithNoTests: true,
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: './tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: './coverage',
  testMatch: ['**/*.spec.ts', '**/*.test.ts'], // Only include *.spec.ts and *.test.ts files
}
