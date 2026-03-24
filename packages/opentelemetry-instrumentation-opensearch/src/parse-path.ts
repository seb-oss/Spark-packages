export const parsePath = (
  path: string
): { index?: string; operation?: string } => {
  const match = path.match(/^\/(?:([^/_][^/]*)\/)?_([^/]+)/)
  if (!match) return {}
  return { index: match[1], operation: match[2] }
}
