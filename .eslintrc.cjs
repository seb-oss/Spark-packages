/* eslint-env node */
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  overrides: [
    {
      files: ['*.spec.ts', '*.spec.tsx', '*.spec.js', '*.spec.jsx'],
      env: {
        jest: true,
      },
      rules: {},
    },
  ],
}
