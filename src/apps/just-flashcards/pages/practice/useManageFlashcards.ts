import { onMounted, ref } from 'vue'
import { addFlashcard, deleteFlashcard, listFlashcards, updateFlashcard } from '../../entities/flashcard/flashcard'
import type { FlashcardRow } from '../../db/appDb'

export function useManageFlashcards() {
  const loading = ref(true)
  const flashcards = ref<FlashcardRow[]>([])
  const editing = ref<FlashcardRow | 'new' | null>(null)
  const front = ref('')
  const back = ref('')
  const saving = ref(false)

  async function load(): Promise<void> {
    loading.value = true
    flashcards.value = await listFlashcards()
    loading.value = false
  }

  function openAdd(): void {
    editing.value = 'new'
    front.value = ''
    back.value = ''
  }

  function openEdit(flashcard: FlashcardRow): void {
    editing.value = flashcard
    front.value = flashcard.front
    back.value = flashcard.back
  }

  function close(): void {
    editing.value = null
  }

  async function save(): Promise<void> {
    const cleanFront = front.value.trim()
    const cleanBack = back.value.trim()
    if (!cleanFront || !cleanBack) return

    saving.value = true
    try {
      if (editing.value === 'new') await addFlashcard(cleanFront, cleanBack)
      else if (editing.value) await updateFlashcard(editing.value.id, cleanFront, cleanBack)
      close()
      await load()
    } finally {
      saving.value = false
    }
  }

  async function remove(flashcard: FlashcardRow): Promise<void> {
    if (!window.confirm('Delete this flashcard? This cannot be undone.')) return
    await deleteFlashcard(flashcard.id)
    await load()
  }

  onMounted(load)

  return { loading, flashcards, editing, front, back, saving, load, openAdd, openEdit, close, save, remove }
}
