<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ArrowRight, Pencil, Trash2 } from 'lucide-vue-next'
import { Rating, type Card, type Grade } from 'ts-fsrs'
import { deleteWord, getWord } from '../../entities/word/word'
import { deleteWordCard, getWordCard, rateWordCard } from '../../entities/word-card/wordCard'
import { getSentencesContainingWord } from '../../entities/sentence/sentence'
import { pickRandomSample } from '../../dumb/random'
import type { SentenceRow, WordRow } from '../../db/appDb'
import type { JumpTarget, TouchedEntities } from './useQueueSelection'

const props = defineProps<{ wordId: string }>()
const emit = defineEmits<{
  done: [touched: TouchedEntities]
  jump: [target: JumpTarget, touched: TouchedEntities]
}>()

const word = ref<WordRow | null>(null)
const card = ref<Card | null>(null)
const exampleSentences = ref<SentenceRow[]>([])
const revealed = ref(false)
const confirmingDelete = ref(false)

onMounted(async () => {
  const [wordRow, wordCard, sentences] = await Promise.all([
    getWord(props.wordId),
    getWordCard(props.wordId),
    getSentencesContainingWord(props.wordId)
  ])
  word.value = wordRow ?? null
  card.value = wordCard ?? null
  exampleSentences.value = pickRandomSample(sentences, 3)
})

function reveal(): void {
  revealed.value = true
}

async function rate(rating: Grade): Promise<void> {
  if (!card.value) return
  await rateWordCard(props.wordId, card.value, rating)
  emit('done', { wordIds: [props.wordId], sentenceIds: [] })
}

function jumpToSentence(sentenceId: string): void {
  emit('jump', { type: 'add-sentence-vocab', sentenceId }, { wordIds: [props.wordId], sentenceIds: [] })
}

function jumpToEdit(): void {
  emit('jump', { type: 'add-examples-to-word', wordId: props.wordId }, { wordIds: [props.wordId], sentenceIds: [] })
}

async function confirmDelete(): Promise<void> {
  await deleteWord(props.wordId)
  await deleteWordCard(props.wordId)
  confirmingDelete.value = false
  emit('done', { wordIds: [props.wordId], sentenceIds: [] })
}
</script>

<template>
  <div
    v-if="word"
    class="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-8"
  >
    <div class="flex justify-end gap-1">
      <button
        type="button"
        class="btn btn-ghost btn-sm btn-circle"
        aria-label="Edit word"
        @click="jumpToEdit"
      >
        <Pencil class="h-4 w-4" />
      </button>
      <button
        type="button"
        class="btn btn-ghost btn-sm btn-circle text-error"
        aria-label="Delete word"
        @click="confirmingDelete = true"
      >
        <Trash2 class="h-4 w-4" />
      </button>
    </div>

    <div class="card w-full shadow-xl">
      <div class="card-body items-center gap-4 text-center">
        <p class="text-3xl font-semibold">
          {{ word.text }}
        </p>

        <ul
          v-if="exampleSentences.length > 0"
          class="flex w-full flex-col gap-1 text-sm opacity-80"
        >
          <li
            v-for="sentence in exampleSentences"
            :key="sentence.id"
            class="flex items-center justify-between gap-2"
          >
            <span>{{ sentence.text }}</span>
            <button
              type="button"
              class="btn btn-ghost btn-xs btn-circle"
              aria-label="Jump to sentence"
              @click="jumpToSentence(sentence.id)"
            >
              <ArrowRight class="h-3 w-3" />
            </button>
          </li>
        </ul>

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
          <p class="text-2xl">
            {{ word.translation }}
          </p>
          <p
            v-if="word.note"
            class="text-sm italic opacity-60"
          >
            {{ word.note }}
          </p>

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
          Delete this word?
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
