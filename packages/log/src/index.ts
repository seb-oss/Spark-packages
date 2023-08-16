import chalk from 'chalk'

export interface Log {
  debug: (message: string, data?: object) => void
  error: (title: string, error?: object) => void
  info: (message: string, data?: object | string) => void
  warn: (title: string, data?: object) => void
}

const LEVEL = (process.env.LOG_LEVEL ?? 'INFO').toUpperCase()

const levelIsAtLeastDebug = LEVEL === 'DEBUG'
const levelIsAtLeastInfo = LEVEL === 'INFO' || levelIsAtLeastDebug
const levelIsAtLeastWarn = LEVEL === 'WARN' || levelIsAtLeastInfo

const print = (
  // eslint-disable-next-line @typescript-eslint/ban-types
  logFn: Function,
  // eslint-disable-next-line @typescript-eslint/ban-types
  titleFn: Function,
  // eslint-disable-next-line @typescript-eslint/ban-types
  messageFn: Function,
  title: string,
  message: string,
  data?: object | string,
) => {
  if (data) {
    logFn(titleFn(title), messageFn(message), data)
  } else {
    logFn(titleFn(title), messageFn(message))
  }
}

export default {
  debug: (message: string, data?: object) => {
    if (!levelIsAtLeastDebug) {
      return
    }

    print(
      console.debug,
      chalk.whiteBright.bold,
      chalk.gray,
      'DEBUG',
      message,
      data,
    )
  },
  error: (title: string, error?: object) => {
    print(console.error, chalk.redBright.bold, chalk.red, 'ERROR', title, error)
  },
  info: (message: string, data?: object | string) => {
    if (!levelIsAtLeastInfo) {
      return
    }

    print(
      console.log,
      chalk.whiteBright.bold,
      chalk.white,
      'INFO ',
      message,
      data,
    )
  },
  warn: (title: string, data?: object) => {
    if (!levelIsAtLeastWarn) {
      return
    }

    print(console.log, chalk.red.bold, chalk.white, 'WARN ', title, data)
  },
} as Log
