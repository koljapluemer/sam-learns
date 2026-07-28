import { computed, type Ref } from 'vue'
import { useAutoGrowRows } from '../../dumb/useAutoGrowRows'
import { mergeParsedRows } from '../../dumb/mergeRows'

export type EntityFormRow = { primary: string; secondary: string; note: string; existingId: string | null }
export type EntityCandidate = { id: string; label: string }

function isRowEmpty(row: EntityFormRow): boolean {
  return row.primary.trim() === '' && row.secondary.trim() === ''
}

// Shared multi-line "primary text + translation (+ optional note)" form used
// by both Add Sentence Vocab (primary = word) and Add Examples to Word
// (primary = sentence): auto-growing rows, a suggest-existing dropdown per
// row backed by a preloaded candidate list, and a simple merge for pasted
// LLM rows.
export function useEntityRowsForm(allCandidates: Ref<EntityCandidate[]>) {
  const { rows, removeRow, reset } = useAutoGrowRows<EntityFormRow>(
    () => ({ primary: '', secondary: '', note: '', existingId: null }),
    isRowEmpty
  )

  // Once a row is linked to an existing entity (via selectExisting, or
  // because it was pre-populated from already-attached data), further edits
  // update that same entity rather than detaching it - only removing the row
  // clears the link. Only an unlinked row's typing is treated as a live
  // search query.
  function updatePrimary(index: number, value: string): void {
    rows.value[index] = { ...rows.value[index], primary: value }
  }

  function selectExisting(index: number, id: string, label: string): void {
    rows.value[index] = { ...rows.value[index], primary: label, existingId: id }
  }

  function candidatesFor(row: EntityFormRow): EntityCandidate[] {
    const query = row.primary.trim().toLowerCase()
    if (row.existingId || !query) return []
    return allCandidates.value.filter((candidate) => candidate.label.toLowerCase().includes(query)).slice(0, 5)
  }

  function mergeParsed(parsed: { primary: string; secondary: string; note?: string }[]): void {
    rows.value = mergeParsedRows(
      rows.value,
      parsed.map((row) => ({ ...row, note: row.note ?? '', existingId: null })),
      isRowEmpty
    )
  }

  const nonEmptyRows = computed(() => rows.value.filter((row) => row.primary.trim() !== ''))

  return { rows, removeRow, reset, updatePrimary, selectExisting, candidatesFor, mergeParsed, nonEmptyRows }
}
