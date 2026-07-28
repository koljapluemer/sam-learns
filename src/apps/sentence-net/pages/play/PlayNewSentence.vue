<script setup lang="ts">
import { ref } from 'vue'
import { addSentence } from '../../entities/sentence/sentence'
import { createSentenceCard } from '../../entities/sentence-card/sentenceCard'
import type { TouchedEntities } from './useQueueSelection'

const emit = defineEmits<{ done: [touched: TouchedEntities] }>()

const text = ref('')
const translation = ref('')
const note = ref('')
const saving = ref(false)

async function save(): Promise<void> {
  if (!text.value.trim() || !translation.value.trim()) return

  saving.value = true
  const id = await addSentence(text.value.trim(), translation.value.trim(), note.value.trim())
  await createSentenceCard(id)
  saving.value = false

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
