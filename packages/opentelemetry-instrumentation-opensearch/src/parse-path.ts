const METHOD_OPERATIONS: Record<string, string> = {
  PUT: 'indices.create',
  DELETE: 'indices.delete',
}

const OPERATION_ALIASES: Record<string, string> = {
  doc: 'index',
}

export const parsePath = (
  path: string,
  method?: string
): { index?: string; operation?: string } => {
  const decoded = decodeURIComponent(path)
  const match = decoded.match(/^\/(?:([^/_][^/]*)\/)?_([^/]+)/)
  if (match) {
    const operation = OPERATION_ALIASES[match[2]] ?? match[2]
    return { index: match[1], operation }
  }

  if (method) {
    const operation = METHOD_OPERATIONS[method.toUpperCase()]
    if (operation) {
      const index = decoded.replace(/^\//, '') || undefined
      return { index, operation }
    }
  }

  return {}
}
