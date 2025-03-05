export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const COMMAND_DELAY = 50
