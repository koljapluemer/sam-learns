// Merges a possibly-new field value into an existing one: identical or blank
// incoming content is a no-op (or a simple fill), otherwise the two are
// joined with a semicolon so neither is lost.
export function mergeField(existing: string, incoming: string): string {
  const existingTrimmed = existing.trim()
  const incomingTrimmed = incoming.trim()
  if (!incomingTrimmed) return existingTrimmed
  if (!existingTrimmed) return incomingTrimmed
  if (existingTrimmed === incomingTrimmed) return existingTrimmed
  return `${existingTrimmed}; ${incomingTrimmed}`
}
