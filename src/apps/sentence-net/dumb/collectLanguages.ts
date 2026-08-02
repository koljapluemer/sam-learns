// Dedupes and sorts raw language values pulled from sentences/words into a
// suggestion list for the language field's smart dropdown.
export function collectLanguages(...lists: string[][]): string[] {
  const seen = new Set<string>()
  for (const list of lists) {
    for (const value of list) {
      const trimmed = value.trim()
      if (trimmed) seen.add(trimmed)
    }
  }
  return [...seen].sort((a, b) => a.localeCompare(b))
}
