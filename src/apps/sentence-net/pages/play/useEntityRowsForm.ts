import { computed, type Ref } from 'vue'
import { useAutoGrowRows } from '../../dumb/useAutoGrowRows'
import { mergeParsedRows } from '../../dumb/mergeRows'
import { mergeField } from '../../dumb/mergeField'

export type EntityFormRow = { primary: string; secondary: string; note: string; existingId: string | null }
export type EntityCandidate = { id: string; text: string; translation: string; note: string }

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

  // Once a row is linked to an existing entity (via selectExisting, a blur
  // match, or because it was pre-populated from already-attached data),
  // further edits update that same entity rather than detaching it - only
  // removing the row clears the link. Only an unlinked row's typing is
  // treated as a live search query.
  function updatePrimary(index: number, value: string): void {
    rows.value[index] = { ...rows.value[index], primary: value, existingId: null }
  }

  // Links a row to an existing entity, filling blank translation/note from
  // it or merging on collision (see mergeField).
  function applyMatch(index: number, matched: EntityCandidate): void {
    const row = rows.value[index]
    rows.value[index] = {
      primary: matched.text,
      secondary: mergeField(matched.translation, row.secondary),
      note: mergeField(matched.note, row.note),
      existingId: matched.id
    }
  }

  function selectExisting(index: number, id: string): void {
    const matched = allCandidates.value.find((candidate) => candidate.id === id)
    if (matched) applyMatch(index, matched)
  }

  // Exact-match check run on blur: if the typed text matches an existing
  // entity's text, link to it (see applyMatch) instead of leaving the row to
  // create a duplicate on save.
  function checkBlurMatch(index: number): void {
    const row = rows.value[index]
    if (row.existingId) return
    const text = row.primary.trim()
    if (!text) return
    const matched = allCandidates.value.find((candidate) => candidate.text === text)
    if (matched) applyMatch(index, matched)
  }

  function candidatesFor(row: EntityFormRow): EntityCandidate[] {
    const query = row.primary.trim().toLowerCase()
    if (row.existingId || !query) return []
    return allCandidates.value.filter((candidate) => candidate.text.toLowerCase().includes(query)).slice(0, 5)
  }

  function mergeParsed(parsed: { primary: string; secondary: string; note?: string }[]): void {
    const resolved: EntityFormRow[] = parsed.map((row) => {
      const matched = allCandidates.value.find((candidate) => candidate.text === row.primary.trim())
      if (matched) {
        return {
          primary: matched.text,
          secondary: mergeField(matched.translation, row.secondary),
          note: mergeField(matched.note, row.note ?? ''),
          existingId: matched.id
        }
      }
      return { primary: row.primary, secondary: row.secondary, note: row.note ?? '', existingId: null }
    })
    rows.value = mergeParsedRows(rows.value, resolved, isRowEmpty)
  }

  const nonEmptyRows = computed(() => rows.value.filter((row) => row.primary.trim() !== ''))

  return {
    rows,
    removeRow,
    reset,
    updatePrimary,
    selectExisting,
    checkBlurMatch,
    candidatesFor,
    mergeParsed,
    nonEmptyRows
  }
}
