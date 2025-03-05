import type { ChildProcess } from 'node:child_process'

export const write = (childProcess: ChildProcess, text: string) =>
  new Promise<void>((resolve, reject) => {
    childProcess.stdin?.write(text, (error) => {
      if (error) reject(error)
      else resolve()
    })
  })
