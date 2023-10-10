import { Schema } from 'avsc'
import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { resolve } from 'path'

export const readSchemas = (path: string) => {
  const absolutePath = resolve(path)
  return readdirSync(absolutePath)
    .filter((file) => file.endsWith('.avsc'))
    .map((filename) => resolve(absolutePath, filename))
    .map((filepath) => readFileSync(filepath, 'utf8'))
    .map((txt) => JSON.parse(txt) as Schema)
}

export const saveTypescript = (ts: string, path: string, name = 'schema'): void => {
  writeFileSync(resolve(path, `${name}.ts`), ts)
}
