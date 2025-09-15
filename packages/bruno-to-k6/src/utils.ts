// treat undefined/blank as empty
export const isBlank = (s: string) => s.trim() === ''

// treat things that parse to {} as empty
export const isParsedEmptyObject = (s: string) => {
  try {
    const v = JSON.parse(s)
    return (
      v &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      Object.keys(v).length === 0
    )
  } catch {
    return false
  }
}
