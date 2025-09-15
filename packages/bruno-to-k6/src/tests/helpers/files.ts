import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

export type FileStructure = {
  [name: string]: string | FileStructure
}

// Helper function to recursively create the file structure on disk
export const createFileStructure = (
  basePath: string,
  structure: FileStructure
) => {
  for (const [name, content] of Object.entries(structure)) {
    const fullPath = path.join(basePath, name)
    if (typeof content === 'string') {
      writeFileSync(fullPath, content, 'utf8')
    } else if (typeof content === 'object' && content !== null) {
      mkdirSync(fullPath, { recursive: true })
      createFileStructure(fullPath, content)
    }
  }
}
