import { formatFile } from '../format'
import { formatImports } from '../imports'
import { formatParsedTypes } from './format'
import { parseTypes } from './parser'
import { Components } from './types'

export const generateSchemas = (components: Components) => {
  const [types, imports] = parseTypes(components.components.schemas)

  return formatFile([...formatImports(imports), ...formatParsedTypes(types)])
}
