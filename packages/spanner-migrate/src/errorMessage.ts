/** Readable message for any thrown value. */
export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)
