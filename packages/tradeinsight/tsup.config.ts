import config from '@sebspark/tsconfig/tsdown'
import { defineConfig } from 'tsdown'

export default defineConfig({
    ...config,
    entry: ['src/index.ts'],
})
