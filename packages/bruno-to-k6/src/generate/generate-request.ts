import type { BrunoRequest } from '@usebruno/lang'
import { generateArgs } from './generate-args'

export const generateRequest = (req: BrunoRequest, ix = 0) => {
  const lines: string[] = []

  const args = generateArgs(req)

  const resVar = `res${ix > 1 ? ix : ''}`
  lines.push(`  // ${req.http.method?.toUpperCase()} ${req.http.url}`)
  lines.push(`  const ${resVar} = http.request(`)
  for (const arg of args) {
    lines.push(`    ${arg},`)
  }
  lines.push(`  )`)
  lines.push(`  check(${resVar}, {'status < 400': r => r.status < 400})`)
  lines.push(``)

  return lines
}
