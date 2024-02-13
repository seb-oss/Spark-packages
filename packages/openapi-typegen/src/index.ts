import { parse, resolve } from 'path'
import { OpenApiDocument } from '@sebspark/openapi-core'
import { pascalCase } from 'change-case'
import { mkdir, readFile, readdir, stat, writeFile } from 'fs/promises'
import * as YAML from 'yaml'
import { format, generate as _generate } from './generator'
import { parseDocument } from './parser'

export const generateTypescript = async (
  name: string,
  doc: OpenApiDocument
): Promise<string> => {
  const parsed = parseDocument(doc)
  const generated = _generate(name, parsed)
  const formatted = await format(generated)

  return formatted
}

export const generate = async (
  input: string,
  output?: string
): Promise<string | undefined> => {
  const docs = await readDocs(input)
  const generated = await generateDocs(docs)

  if (!output) return generated.map((d) => d.ts).join('\n\n')
  await saveDocs(output, generated)
}

type Doc = {
  name: string
  doc: OpenApiDocument
}
type GeneratedDoc = Doc & {
  ts: string
}
const readDocs = async (input: string): Promise<Doc[]> => {
  const path = resolve(input)
  const stats = await stat(path)

  const filePaths: string[] = []

  if (stats.isFile()) filePaths.push(path)
  if (stats.isDirectory()) {
    const files = await readdir(path)
    filePaths.push(...files.map((f) => resolve(path, f)))
  }

  const readFiles: Doc[] = []
  for (const p of filePaths) {
    const { name, ext } = parse(p)
    let doc: OpenApiDocument
    switch (ext) {
      case '.json': {
        console.log(`Reading ${p}`)
        const txt = await readFile(p, 'utf8')
        doc = JSON.parse(txt) as OpenApiDocument
        break
      }
      case '.yml':
      case '.yaml': {
        console.log(`Reading ${p}`)
        const txt = await readFile(p, 'utf8')
        doc = YAML.parse(txt) as OpenApiDocument
        break
      }
      default:
        continue
    }
    readFiles.push({
      doc,
      name,
    })
  }
  return readFiles
}

const generateDocs = async (files: Doc[]): Promise<GeneratedDoc[]> => {
  const generated: GeneratedDoc[] = []
  for (const doc of files) {
    console.log(`Generating ${doc.name}`)
    const ts = await generateTypescript(classname(doc.name), doc.doc)
    generated.push({
      ...doc,
      ts,
    })
  }
  return generated
}

const saveDocs = async (
  output: string,
  docs: GeneratedDoc[]
): Promise<void> => {
  const stats = await stat(output)
  const dir = stats.isDirectory() ? output : parse(output).dir
  await mkdir(dir, { recursive: true })
  for (const doc of docs) {
    const path = resolve(dir, `${filename(doc.name)}.ts`)
    console.log(`Writing ${path}`)
    await writeFile(path, doc.ts, 'utf8')
  }
}

export const classname = (name: string): string => {
  return pascalCase(name.replace(/\d+/g, ''))
}

export const filename = (name: string): string => {
  return name.replace(/\./g, '_')
}
