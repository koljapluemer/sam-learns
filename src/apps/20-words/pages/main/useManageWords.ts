import { onMounted, ref } from 'vue'
import { allWords, deleteWord, updateWord } from '../../entities/word/word'
import { useAutoGrowRows } from '../../dumb/useAutoGrowRows'
import type { ExampleRow, NoteRow, WordRow } from '../../db/appDb'

export function useManageWords() {
  const loading = ref(true)
  const words = ref<WordRow[]>([])

  const editing = ref<WordRow | null>(null)
  const editWord = ref('')
  const editMeaning = ref('')
  const saving = ref(false)

  const { rows: editExamples, removeRow: removeEditExample, reset: resetEditExamples } = useAutoGrowRows<ExampleRow>(
    () => ({ sentence: '', translation: '' }),
    (row) => row.sentence.trim() === '' && row.translation.trim() === ''
  )
  const { rows: editNotes, removeRow: removeEditNote, reset: resetEditNotes } = useAutoGrowRows<NoteRow>(
    () => ({ text: '' }),
    (row) => row.text.trim() === ''
  )

  async function load(): Promise<void> {
    loading.value = true
    words.value = await allWords()
    loading.value = false
  }

  function openEdit(word: WordRow): void {
    editing.value = word
    editWord.value = word.word
    editMeaning.value = word.meaning
    resetEditExamples()
    resetEditNotes()
    editExamples.value = word.examples.length > 0 ? [...word.examples, { sentence: '', translation: '' }] : editExamples.value
    editNotes.value = word.notes.length > 0 ? [...word.notes, { text: '' }] : editNotes.value
  }

  function closeEdit(): void {
    editing.value = null
  }

  async function saveEdit(): Promise<void> {
    const word = editing.value
    if (!word || !editWord.value.trim() || !editMeaning.value.trim()) return

    saving.value = true
    try {
      await updateWord(word.id, {
        word: editWord.value.trim(),
        meaning: editMeaning.value.trim(),
        examples: editExamples.value.filter((row) => row.sentence.trim() !== '' || row.translation.trim() !== ''),
        notes: editNotes.value.filter((row) => row.text.trim() !== '')
      })
      closeEdit()
      await load()
    } finally {
      saving.value = false
    }
  }

  async function remove(word: WordRow): Promise<void> {
    if (!window.confirm(`Delete "${word.word}"? This cannot be undone.`)) return
    await deleteWord(word.id)
    await load()
  }

  onMounted(load)

  return {
    loading,
    words,
    editing,
    editWord,
    editMeaning,
    editExamples,
    removeEditExample,
    editNotes,
    removeEditNote,
    saving,
    openEdit,
    closeEdit,
    saveEdit,
    remove
  }
}
