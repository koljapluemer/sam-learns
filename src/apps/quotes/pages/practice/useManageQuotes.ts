import { onMounted, ref } from 'vue'
import { addQuote, deleteQuote, listQuotes, updateQuote } from '../../entities/quote/quote'
import type { QuoteRow } from '../../db/appDb'

export function useManageQuotes() {
  const loading = ref(true)
  const quotes = ref<QuoteRow[]>([])

  const editing = ref<QuoteRow | 'new' | null>(null)
  const editContent = ref('')
  const editAttribution = ref('')
  const saving = ref(false)

  async function load(): Promise<void> {
    loading.value = true
    quotes.value = await listQuotes()
    loading.value = false
  }

  function openAdd(): void {
    editing.value = 'new'
    editContent.value = ''
    editAttribution.value = ''
  }

  function openEdit(quote: QuoteRow): void {
    editing.value = quote
    editContent.value = quote.content
    editAttribution.value = quote.attribution
  }

  function closeEdit(): void {
    editing.value = null
  }

  async function saveEdit(): Promise<void> {
    const content = editContent.value.trim()
    if (!content) return

    saving.value = true
    try {
      if (editing.value === 'new') {
        await addQuote(content, editAttribution.value.trim())
      } else if (editing.value) {
        await updateQuote(editing.value.id, content, editAttribution.value.trim())
      }
      closeEdit()
      await load()
    } finally {
      saving.value = false
    }
  }

  async function remove(quote: QuoteRow): Promise<void> {
    if (!window.confirm(`Delete this quote? This cannot be undone.`)) return
    await deleteQuote(quote.id)
    await load()
  }

  onMounted(load)

  return {
    loading,
    quotes,
    editing,
    editContent,
    editAttribution,
    saving,
    openAdd,
    openEdit,
    closeEdit,
    saveEdit,
    remove
  }
}
