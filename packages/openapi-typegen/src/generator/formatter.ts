import { type Options, format as pFormat } from 'prettier'

const options: Options = {
  parser: 'typescript',
  singleQuote: true,
  semi: false,
  trailingComma: 'all',
}

export const format = async (code: string): Promise<string> =>
  pFormat(code, options)
