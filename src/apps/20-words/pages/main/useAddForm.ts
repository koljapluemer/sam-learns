import { onMounted, ref } from 'vue'
import { addWord, countWordsAddedToday } from '../../entities/word/word'
import { useAutoGrowRows } from '../../dumb/useAutoGrowRows'
import { useLocalSetting } from '@/shared/settings/useLocalSetting'
import type { ExampleRow, NoteRow } from '../../db/appDb'

export const DAILY_GOAL = 20

export function useAddForm() {
  const language = useLocalSetting<string>('20-words-language', '')
  const word = ref('')
  const meaning = ref('')
  const todayCount = ref(0)
  const saving = ref(false)

  const { rows: examples, removeRow: removeExample, reset: resetExamples } = useAutoGrowRows<ExampleRow>(
    () => ({ sentence: '', translation: '' }),
    (row) => row.sentence.trim() === '' && row.translation.trim() === ''
  )
  const { rows: notes, removeRow: removeNote, reset: resetNotes } = useAutoGrowRows<NoteRow>(
    () => ({ text: '' }),
    (row) => row.text.trim() === ''
  )

  async function refreshTodayCount(): Promise<void> {
    todayCount.value = await countWordsAddedToday()
  }

  async function save(): Promise<void> {
    if (!word.value.trim() || !meaning.value.trim()) return

    saving.value = true
    try {
      await addWord({
        word: word.value.trim(),
        meaning: meaning.value.trim(),
        language: language.value,
        examples: examples.value.filter((row) => row.sentence.trim() !== '' || row.translation.trim() !== ''),
        notes: notes.value.filter((row) => row.text.trim() !== '')
      })

      word.value = ''
      meaning.value = ''
      resetExamples()
      resetNotes()
      await refreshTodayCount()
    } finally {
      saving.value = false
    }
  }

  onMounted(refreshTodayCount)

  return { word, meaning, examples, removeExample, notes, removeNote, todayCount, saving, save }
}
