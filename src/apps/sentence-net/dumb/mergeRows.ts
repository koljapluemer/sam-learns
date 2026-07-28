// Merges freshly-parsed rows into existing form rows: blank existing rows are
// filled first (in order), any leftover parsed rows are appended as new
// rows. Existing non-blank rows are left untouched - a simple merge, not a
// smart diff.
export function mergeParsedRows<T>(existingRows: T[], parsedRows: T[], isRowEmpty: (row: T) => boolean): T[] {
  const merged = [...existingRows]
  let parsedIndex = 0

  for (let i = 0; i < merged.length && parsedIndex < parsedRows.length; i++) {
    if (isRowEmpty(merged[i])) {
      merged[i] = parsedRows[parsedIndex]
      parsedIndex++
    }
  }

  while (parsedIndex < parsedRows.length) {
    merged.push(parsedRows[parsedIndex])
    parsedIndex++
  }

  return merged
}
