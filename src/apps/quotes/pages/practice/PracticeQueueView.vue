<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Rating, type Grade } from 'ts-fsrs'
import { rateClozeCard } from '../../entities/quote-cloze-card/quoteClozeCard'
import { listQuotes } from '../../entities/quote/quote'
import { logActivity } from '@/shared/activity/useLearningEvent'
import { buildClozeFront, buildClozeParts } from '../../dumb/cloze'
import { pickNextCandidate, markQuoteTouched, type ClozeCandidate } from './useQuotePracticeQueue'

const emit = defineEmits<{ 'go-to-manage': [] }>()

const loading = ref(true)
const hasAnyQuotes = ref(true)
const candidate = ref<ClozeCandidate | null>(null)
const revealed = ref(false)

const front = computed(() => (candidate.value ? buildClozeFront(candidate.value.quote.content, candidate.value.level) : ''))
const parts = computed(() =>
  candidate.value ? buildClozeParts(candidate.value.quote.content, candidate.value.level) : { visible: '', clozed: '' }
)

async function loadNext(): Promise<void> {
  loading.value = true
  revealed.value = false
  const next = await pickNextCandidate()
  candidate.value = next
  loading.value = false
}

onMounted(async () => {
  hasAnyQuotes.value = (await listQuotes()).length > 0
  await loadNext()
})

function reveal(): void {
  revealed.value = true
}

async function rate(rating: Grade): Promise<void> {
  const current = candidate.value
  if (!current) return
  await rateClozeCard(current.quote.id, current.level, current.card, rating)
  markQuoteTouched(current.quote.id)
  await logActivity('quotes')
  hasAnyQuotes.value = true
  await loadNext()
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-8">
    <div
      v-if="loading"
      class="flex justify-center"
    >
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div
      v-else-if="!hasAnyQuotes"
      class="flex flex-col items-center gap-4 text-center opacity-70"
    >
      <p>No quotes yet. Add one to get started.</p>
      <button
        type="button"
        class="btn btn-primary"
        @click="emit('go-to-manage')"
      >
        Add a quote
      </button>
    </div>

    <div
      v-else-if="!candidate"
      class="text-center opacity-70"
    >
      All caught up. Nothing due right now.
    </div>

    <div
      v-else
      class="card w-full shadow-xl"
    >
      <div class="card-body items-center gap-4 text-center">
        <p
          v-if="candidate.quote.attribution"
          class="text-sm italic opacity-60"
        >
          {{ candidate.quote.attribution }}
        </p>

        <p
          v-if="!revealed"
          class="text-2xl font-medium"
        >
          {{ front }}
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
          <p class="text-2xl font-medium">
            <span v-if="parts.visible">{{ parts.visible }} </span><mark class="rounded bg-warning/60">{{ parts.clozed }}</mark>
          </p>

          <div class="divider" />

          <div class="grid w-full grid-cols-4 gap-2">
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
  </div>
</template>
