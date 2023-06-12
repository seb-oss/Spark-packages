import { EnsureExecutorSchema } from './schema'
import executor from './executor'

const options: EnsureExecutorSchema = {
  organisation: 'sparkify',
  package: 'sparkify',
  path: 'packages',
}

describe('Ensure Executor', () => {
  it('can run', async () => {
    const output = await executor(options)
    expect(output.success).toBe(true)
  })
})
