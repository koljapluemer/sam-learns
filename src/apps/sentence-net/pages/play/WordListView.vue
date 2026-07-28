<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Pencil, Trash2 } from 'lucide-vue-next'
import { deleteWord, listWords } from '../../entities/word/word'
import { deleteWordCard } from '../../entities/word-card/wordCard'
import type { WordRow } from '../../db/appDb'

const emit = defineEmits<{ edit: [wordId: string] }>()

const loading = ref(true)
const words = ref<WordRow[]>([])

async function load(): Promise<void> {
  loading.value = true
  words.value = await listWords()
  loading.value = false
}

async function remove(word: WordRow): Promise<void> {
  await deleteWord(word.id)
  await deleteWordCard(word.id)
  await load()
}

onMounted(load)
</script>

<template>
  <div class="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-8">
    <h1 class="text-2xl font-semibold">
      Vocab
    </h1>

    <div v-if="loading">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div
      v-else-if="words.length === 0"
      class="opacity-70"
    >
      No words yet.
    </div>

    <div
      v-else
      class="overflow-x-auto"
    >
      <table class="table table-sm">
        <thead>
          <tr>
            <th>Word</th>
            <th>Translation</th>
            <th class="w-1" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="word in words"
            :key="word.id"
          >
            <td>{{ word.text }}</td>
            <td>{{ word.translation }}</td>
            <td class="flex justify-end gap-1">
              <button
                type="button"
                class="btn btn-ghost btn-sm btn-circle"
                aria-label="Edit"
                @click="emit('edit', word.id)"
              >
                <Pencil class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-sm btn-circle text-error"
                aria-label="Delete"
                @click="remove(word)"
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
