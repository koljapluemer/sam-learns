<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ArrowRight, Pencil, Trash2 } from 'lucide-vue-next'
import { Rating, type Card, type Grade } from 'ts-fsrs'
import { deleteSentence, getSentence } from '../../entities/sentence/sentence'
import { deleteSentenceCard, getSentenceCard, rateSentenceCard } from '../../entities/sentence-card/sentenceCard'
import { getWordsByIds } from '../../entities/word/word'
import type { SentenceRow, WordRow } from '../../db/appDb'
import type { JumpTarget, TouchedEntities } from './useQueueSelection'

const props = defineProps<{ sentenceId: string }>()
const emit = defineEmits<{
  done: [touched: TouchedEntities]
  jump: [target: JumpTarget, touched: TouchedEntities]
}>()

const sentence = ref<SentenceRow | null>(null)
const card = ref<Card | null>(null)
const words = ref<WordRow[]>([])
const revealed = ref(false)
const confirmingDelete = ref(false)

onMounted(async () => {
  const [sentenceRow, sentenceCard] = await Promise.all([getSentence(props.sentenceId), getSentenceCard(props.sentenceId)])
  sentence.value = sentenceRow ?? null
  card.value = sentenceCard ?? null

  if (sentenceRow) {
    const wordMap = await getWordsByIds(sentenceRow.wordIds)
    words.value = sentenceRow.wordIds.map((id) => wordMap.get(id)).filter((row): row is WordRow => row !== undefined)
  }
})

function reveal(): void {
  revealed.value = true
}

async function rate(rating: Grade): Promise<void> {
  if (!card.value) return
  await rateSentenceCard(props.sentenceId, card.value, rating)
  emit('done', { sentenceIds: [props.sentenceId], wordIds: [] })
}

function jumpToWord(wordId: string): void {
  emit('jump', { type: 'add-examples-to-word', wordId }, { sentenceIds: [props.sentenceId], wordIds: [] })
}

function jumpToEdit(): void {
  emit(
    'jump',
    { type: 'add-sentence-vocab', sentenceId: props.sentenceId },
    { sentenceIds: [props.sentenceId], wordIds: [] }
  )
}

async function confirmDelete(): Promise<void> {
  await deleteSentence(props.sentenceId)
  await deleteSentenceCard(props.sentenceId)
  confirmingDelete.value = false
  emit('done', { sentenceIds: [props.sentenceId], wordIds: [] })
}
</script>

<template>
  <div
    v-if="sentence"
    class="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-8"
  >
    <div class="flex justify-end gap-1">
      <button
        type="button"
        class="btn btn-ghost btn-sm btn-circle"
        aria-label="Edit sentence"
        @click="jumpToEdit"
      >
        <Pencil class="h-4 w-4" />
      </button>
      <button
        type="button"
        class="btn btn-ghost btn-sm btn-circle text-error"
        aria-label="Delete sentence"
        @click="confirmingDelete = true"
      >
        <Trash2 class="h-4 w-4" />
      </button>
    </div>

    <div class="card w-full shadow-xl">
      <div class="card-body items-center gap-4 text-center">
        <p class="text-2xl font-semibold">
          {{ sentence.text }}
        </p>

        <button
          v-if="!revealed"
          type="button"
          class="btn"
          @click="reveal"
        >
          Show answer
        </button>

        <template v-else>
          <div class="divider" />
          <p class="text-xl opacity-70">
            {{ sentence.translation }}
          </p>
          <p
            v-if="sentence.note"
            class="text-sm italic opacity-60"
          >
            {{ sentence.note }}
          </p>

          <table
            v-if="words.length > 0"
            class="table table-sm w-full"
          >
            <tbody>
              <tr
                v-for="word in words"
                :key="word.id"
              >
                <td>{{ word.text }}</td>
                <td class="opacity-70">
                  {{ word.translation }}
                </td>
                <td class="w-1">
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs btn-circle"
                    aria-label="Jump to word"
                    @click="jumpToWord(word.id)"
                  >
                    <ArrowRight class="h-3 w-3" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="mt-2 grid w-full grid-cols-4 gap-2">
            <button
              type="button"
              class="btn btn-sm sm:btn-md"
              @click="rate(Rating.Again)"
            >
              Again
            </button>
            <button
              type="button"
              class="btn btn-sm sm:btn-md"
              @click="rate(Rating.Hard)"
            >
              Hard
            </button>
            <button
              type="button"
              class="btn btn-sm sm:btn-md"
              @click="rate(Rating.Good)"
            >
              Good
            </button>
            <button
              type="button"
              class="btn btn-sm sm:btn-md"
              @click="rate(Rating.Easy)"
            >
              Easy
            </button>
          </div>
        </template>
      </div>
    </div>

    <dialog
      class="modal"
      :class="{ 'modal-open': confirmingDelete }"
    >
      <div class="modal-box">
        <h3 class="text-lg font-semibold">
          Delete this sentence?
        </h3>
        <div class="modal-action">
          <button
            type="button"
            class="btn"
            @click="confirmingDelete = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-error"
            @click="confirmDelete"
          >
            Delete
          </button>
        </div>
      </div>
      <form
        method="dialog"
        class="modal-backdrop"
      >
        <button
          type="button"
          @click="confirmingDelete = false"
        >
          close
        </button>
      </form>
    </dialog>
  </div>
</template>
