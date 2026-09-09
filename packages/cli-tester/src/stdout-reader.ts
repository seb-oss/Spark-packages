import type { ChildProcess } from 'node:child_process'

/**
 * Reads stdout chunks from a child process one at a time, in order.
 *
 * `input()` and `output()` both need to consume "the next chunk(s)" written
 * by the CLI process. Attaching and detaching a fresh `'data'` listener for
 * each call is racy: if the process writes between one call finishing and
 * the next call attaching its listener (which is far more likely under CPU
 * contention, e.g. when the whole monorepo's tests run in parallel), that
 * chunk is silently dropped forever and the next call times out waiting for
 * data that already arrived.
 *
 * This reader attaches a single listener for the lifetime of the process and
 * queues chunks so no data is ever lost, regardless of scheduling.
 */
export class StdoutReader {
  private readonly chunks: Buffer[] = []
  private waiter: ((chunk: Buffer) => void) | undefined

  constructor(childProcess: ChildProcess) {
    childProcess.stdout?.on('data', (chunk: Buffer) => {
      if (this.waiter) {
        const waiter = this.waiter
        this.waiter = undefined
        waiter(chunk)
      } else {
        this.chunks.push(chunk)
      }
    })
  }

  /** Resolves with the next stdout chunk, queued or future. */
  next(): Promise<Buffer> {
    const queued = this.chunks.shift()
    if (queued) return Promise.resolve(queued)

    return new Promise((resolve) => {
      this.waiter = resolve
    })
  }

  /**
   * Puts a chunk back at the front of the queue.
   *
   * Under load, a single stdout chunk can contain more than one logical
   * inquirer message (e.g. a confirmation followed by the next prompt's
   * render). A consumer that only needed the first part must push the
   * unconsumed remainder back so the next `next()` call doesn't lose it.
   */
  unshift(chunk: Buffer): void {
    this.chunks.unshift(chunk)
  }
}
