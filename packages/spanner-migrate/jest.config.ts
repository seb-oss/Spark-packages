export default {
  displayName: '@sebspark/spanner-migrate',
  testEnvironment: 'node',
  passWithNoTests: true,
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: './tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: './coverage',
}
