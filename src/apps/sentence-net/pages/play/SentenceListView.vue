<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Pencil, Trash2 } from 'lucide-vue-next'
import { deleteSentence, listSentences } from '../../entities/sentence/sentence'
import { deleteSentenceCard } from '../../entities/sentence-card/sentenceCard'
import type { SentenceRow } from '../../db/appDb'

const emit = defineEmits<{ edit: [sentenceId: string] }>()

const loading = ref(true)
const sentences = ref<SentenceRow[]>([])

async function load(): Promise<void> {
  loading.value = true
  sentences.value = await listSentences()
  loading.value = false
}

async function remove(sentence: SentenceRow): Promise<void> {
  await deleteSentence(sentence.id)
  await deleteSentenceCard(sentence.id)
  await load()
}

onMounted(load)
</script>

<template>
  <div class="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-8">
    <h1 class="text-2xl font-semibold">
      Sentences
    </h1>

    <div v-if="loading">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div
      v-else-if="sentences.length === 0"
      class="opacity-70"
    >
      No sentences yet.
    </div>

    <div
      v-else
      class="overflow-x-auto"
    >
      <table class="table table-sm">
        <thead>
          <tr>
            <th>Sentence</th>
            <th>Translation</th>
            <th class="w-1" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="sentence in sentences"
            :key="sentence.id"
          >
            <td>{{ sentence.text }}</td>
            <td>{{ sentence.translation }}</td>
            <td class="flex justify-end gap-1">
              <button
                type="button"
                class="btn btn-ghost btn-sm btn-circle"
                aria-label="Edit"
                @click="emit('edit', sentence.id)"
              >
                <Pencil class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-sm btn-circle text-error"
                aria-label="Delete"
                @click="remove(sentence)"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
