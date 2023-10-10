import { readSchemas, saveTypescript } from './files'
import { parse } from './parse'

export type Opts = {
  inputpath: string
  outputpath?: string
  schemaname?: string
}
export const parseSchemas = ({ inputpath, outputpath, schemaname }: Opts) => {
  const schemas = readSchemas(inputpath)
  const ts = parse(...schemas)
  saveTypescript(ts, outputpath || inputpath, schemaname)
}
