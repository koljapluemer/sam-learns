<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  addSentence,
  findSentenceByText,
  listSentenceLanguages,
  updateSentenceLanguage,
  updateSentenceNote,
  updateSentenceText
} from '../../entities/sentence/sentence'
import { createSentenceCard } from '../../entities/sentence-card/sentenceCard'
import { listWordLanguages } from '../../entities/word/word'
import { mergeField } from '../../dumb/mergeField'
import { collectLanguages } from '../../dumb/collectLanguages'
import { useLocalSetting } from '@/shared/settings/useLocalSetting'
import type { TouchedEntities } from './useQueueSelection'

const emit = defineEmits<{ done: [touched: TouchedEntities] }>()

const text = ref('')
const translation = ref('')
const note = ref('')
const saving = ref(false)

// Persists across saves and screen changes, so the field auto-fills with the
// language the user last entered.
const language = useLocalSetting('sentence-net-language', '')
const languageSuggestions = ref<string[]>([])

onMounted(async () => {
  const [sentenceLanguages, wordLanguages] = await Promise.all([listSentenceLanguages(), listWordLanguages()])
  languageSuggestions.value = collectLanguages(sentenceLanguages, wordLanguages)
})

async function save(): Promise<void> {
  if (!text.value.trim() || !translation.value.trim()) return

  saving.value = true
  const trimmedText = text.value.trim()
  const trimmedTranslation = translation.value.trim()
  const trimmedNote = note.value.trim()
  const trimmedLanguage = language.value.trim()

  // Sentences are unique by text: typing one that already exists updates it
  // (merging translation/note on collision) instead of creating a duplicate.
  const existing = await findSentenceByText(trimmedText)
  let id: string
  if (existing) {
    id = existing.id
    await updateSentenceText(id, trimmedText, mergeField(existing.translation, trimmedTranslation))
    await updateSentenceNote(id, mergeField(existing.note, trimmedNote))
    await updateSentenceLanguage(id, mergeField(existing.language, trimmedLanguage))
  } else {
    id = await addSentence(trimmedText, trimmedTranslation, trimmedNote, trimmedLanguage)
    await createSentenceCard(id)
  }
  saving.value = false
  language.value = trimmedLanguage

  emit('done', { sentenceIds: [id], wordIds: [] })
}
</script>

<template>
  <div class="mx-auto flex w-full flex-col gap-4 px-4 py-8">
    <h2 class="text-xl font-semibold">
      New sentence
    </h2>

    <form
      class="flex flex-col gap-4 w-full"
      @submit.prevent="save"
    >
      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium">Sentence</span>
        <textarea
          v-model="text"
          class="textarea w-full font-bold"
          rows="2"
          required
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium">Translation</span>
        <textarea
          v-model="translation"
          class="textarea w-full font-bold"
          rows="2"
          required
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium">Note <span class="opacity-60">(optional)</span></span>
        <textarea
          v-model="note"
          class="textarea w-full"
          rows="2"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium">Language <span class="opacity-60">(optional)</span></span>
        <input
          v-model="language"
          type="text"
          list="new-sentence-language-options"
          class="input w-full"
        >
        <datalist id="new-sentence-language-options">
          <option
            v-for="lang in languageSuggestions"
            :key="lang"
            :value="lang"
          />
        </datalist>
      </label>

      <button
        type="submit"
        class="btn btn-primary"
        :disabled="saving"
      >
        Save
      </button>
    </form>
  </div>
</template>
