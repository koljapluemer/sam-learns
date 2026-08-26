<script setup lang="ts">
import { ref, watch } from 'vue'
import { ThumbsDown, ThumbsUp } from 'lucide-vue-next'
import AudioPlayButton from '../../dumb/AudioPlayButton.vue'
import AudioRecorder from '../../dumb/AudioRecorder.vue'
import RadialCountdown from '../../dumb/RadialCountdown.vue'
import { getExpressionAudioUrl } from '../../entities/phrase-catalog/phraseCatalog'
import { usePracticeQueue, type PracticeItem } from './usePracticeQueue'

type Stage = 'intro' | 'countdown' | 'recall'

const queue = usePracticeQueue()

const stage = ref<Stage>('recall')
const recorded = ref(false)
const checked = ref(false)
const feedback = ref<'up' | 'down' | null>(null)

watch(
  () => queue.item.value,
  (next) => {
    recorded.value = false
    checked.value = false
    feedback.value = null
    stage.value = next && !next.schedule ? 'intro' : 'recall'
  },
  { immediate: true }
)

function contextLabel(item: PracticeItem): string {
  return item.expression.note ? `${item.goalKey} · ${item.expression.note}` : item.goalKey
}

async function handleRate(kind: 'up' | 'down'): Promise<void> {
  if (feedback.value) return
  feedback.value = kind
  await new Promise((resolve) => setTimeout(resolve, 250))
  await queue.rate(kind === 'up' ? queue.Rating.Good : queue.Rating.Again)
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-8">
    <div
      v-if="queue.loading.value"
      class="flex justify-center py-8"
    >
      <span class="loading loading-spinner loading-lg" />
    </div>

    <p
      v-else-if="!queue.item.value"
      class="py-8 text-center opacity-70"
    >
      All caught up. Nothing due right now.
    </p>

    <RadialCountdown
      v-else-if="stage === 'countdown'"
      :duration-ms="3000"
      @complete="stage = 'recall'"
    />

    <div
      v-else-if="stage === 'intro'"
      class="card w-full shadow-xl"
    >
      <div class="card-body items-center gap-3 text-center">
        <p class="text-xs font-medium tracking-wide uppercase opacity-60">
          {{ queue.item.value.languageName }}
        </p>
        <p class="text-lg opacity-80">
          {{ contextLabel(queue.item.value) }}
        </p>
        <p class="text-3xl font-semibold">
          {{ queue.item.value.expression.text }}
        </p>
        <AudioPlayButton :audio-url="getExpressionAudioUrl(queue.item.value.languageCode, queue.item.value.expression.text)" />
        <p class="pt-2 text-sm opacity-60">
          Repeat out loud until you memorized it
        </p>
        <button
          type="button"
          class="btn btn-primary btn-block"
          @click="stage = 'countdown'"
        >
          Got it
        </button>
      </div>
    </div>

    <div
      v-else
      class="card w-full shadow-xl"
    >
      <div class="card-body items-center gap-3 text-center">
        <p class="text-xs font-medium tracking-wide uppercase opacity-60">
          {{ queue.item.value.languageName }}
        </p>

        <template v-if="!checked">
          <p class="text-sm font-medium opacity-70">
            Express this
          </p>
          <p class="text-3xl font-semibold">
            {{ contextLabel(queue.item.value) }}
          </p>

          <AudioRecorder
            :key="queue.item.value.id"
            v-model:recorded="recorded"
            class="pt-2"
          />

          <button
            v-if="recorded"
            type="button"
            class="btn btn-primary btn-block"
            @click="checked = true"
          >
            Check
          </button>
        </template>

        <template v-else>
          <p class="text-sm opacity-60">
            {{ contextLabel(queue.item.value) }}
          </p>
          <p class="text-3xl font-semibold">
            {{ queue.item.value.expression.text }}
          </p>
          <AudioPlayButton :audio-url="getExpressionAudioUrl(queue.item.value.languageCode, queue.item.value.expression.text)" />

          <div class="flex justify-center gap-6 pt-2">
            <button
              type="button"
              class="btn btn-circle btn-lg"
              :class="feedback === 'down' ? 'btn-error' : 'btn-outline'"
              :disabled="feedback !== null"
              aria-label="Didn't know it"
              @click="handleRate('down')"
            >
              <ThumbsDown />
            </button>
            <button
              type="button"
              class="btn btn-circle btn-lg"
              :class="feedback === 'up' ? 'btn-success' : 'btn-outline'"
              :disabled="feedback !== null"
              aria-label="Knew it"
              @click="handleRate('up')"
            >
              <ThumbsUp />
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
