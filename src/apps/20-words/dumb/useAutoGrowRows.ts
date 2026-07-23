import { ref, watch, type Ref } from 'vue'

// Generic "smart multi-form" list: whenever the last row stops being empty, a
// fresh empty row is appended automatically. Rows can also be removed
// directly; a single empty row is always kept as the trailing entry.
export function useAutoGrowRows<T>(makeEmptyRow: () => T, isRowEmpty: (row: T) => boolean): {
  rows: Ref<T[]>
  removeRow: (index: number) => void
  reset: () => void
} {
  const rows = ref<T[]>([makeEmptyRow()]) as Ref<T[]>

  watch(
    rows,
    (current) => {
      const last = current[current.length - 1]
      if (last !== undefined && !isRowEmpty(last)) {
        current.push(makeEmptyRow())
      }
    },
    { deep: true }
  )

  function removeRow(index: number): void {
    rows.value.splice(index, 1)
    if (rows.value.length === 0) {
      rows.value.push(makeEmptyRow())
    }
  }

  function reset(): void {
    rows.value = [makeEmptyRow()]
  }

  return { rows, removeRow, reset }
}
