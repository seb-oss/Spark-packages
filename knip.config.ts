import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  workspaces: {
    'packages/*': {
      entry: [
        'src/index.{ts,js}!'
      ],
      project: [
        'src/**/*.{ts,tsx,js,mjs,cjs}!',
        '!**/*.spec.ts!',
        '!**/__tests__/**!',
        '!**/__scaffold__/**!'
      ]
    }
  },
  ignore: [
    '**/migrations/**',
    '**/*.d.ts'
  ]
}

export default config
