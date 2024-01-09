import { format as pFormat, Options } from 'prettier'

const options: Options = {
  parser: 'typescript',
  singleQuote: true,
  semi: false,
  trailingComma: 'all',
}

export const format = async (code: string): Promise<string> =>
  pFormat(code, options)
