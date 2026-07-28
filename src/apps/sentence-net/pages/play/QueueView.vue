<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { logActivity } from '@/shared/activity/useLearningEvent'
import { pickNextScreen, type JumpTarget, type ScreenState, type TouchedEntities } from './useQueueSelection'
import PlayNewSentence from './PlayNewSentence.vue'
import PlayAddSentenceVocab from './PlayAddSentenceVocab.vue'
import PlayPracticeSentence from './PlayPracticeSentence.vue'
import PlayPracticeVocab from './PlayPracticeVocab.vue'
import PlayAddExamplesToWord from './PlayAddExamplesToWord.vue'

const props = defineProps<{ initialScreen?: ScreenState }>()

const NO_TOUCHED: TouchedEntities = { sentenceIds: [], wordIds: [] }

const loading = ref(!props.initialScreen)
const screen = ref<ScreenState | null>(props.initialScreen ?? null)

// Entities touched by a screen we jumped away from mid-task (not a
// completion), folded into the exclusion set of the next real completion so
// they still aren't immediately re-picked (spec: exclude the last-touched
// entity in any and all constellations).
let carryOverTouched: TouchedEntities = NO_TOUCHED

async function advance(exclude: TouchedEntities): Promise<void> {
  loading.value = true
  screen.value = await pickNextScreen(exclude)
  loading.value = false
}

async function onDone(touched: TouchedEntities): Promise<void> {
  await logActivity('sentence-net')

  const merged: TouchedEntities = {
    sentenceIds: [...touched.sentenceIds, ...carryOverTouched.sentenceIds],
    wordIds: [...touched.wordIds, ...carryOverTouched.wordIds]
  }
  carryOverTouched = NO_TOUCHED
  await advance(merged)
}

function onJump(target: JumpTarget, touched: TouchedEntities): void {
  carryOverTouched = touched
  screen.value = target
}

function force(target: ScreenState): void {
  screen.value = target
}

defineExpose({ force })

onMounted(() => {
  if (!props.initialScreen) advance(NO_TOUCHED)
})
</script>

<template>
  <div
    v-if="loading"
    class="flex justify-center py-16"
  >
    <span class="loading loading-spinner loading-lg" />
  </div>
  <template v-else-if="screen">
    <PlayNewSentence
      v-if="screen.type === 'new-example-sentence'"
      @done="onDone"
    />
    <PlayAddSentenceVocab
      v-else-if="screen.type === 'add-sentence-vocab'"
      :sentence-id="screen.sentenceId"
      @done="onDone"
    />
    <PlayPracticeSentence
      v-else-if="screen.type === 'practice-sentence'"
      :sentence-id="screen.sentenceId"
      @done="onDone"
      @jump="onJump"
    />
    <PlayPracticeVocab
      v-else-if="screen.type === 'practice-vocab'"
      :word-id="screen.wordId"
      @done="onDone"
      @jump="onJump"
    />
    <PlayAddExamplesToWord
      v-else-if="screen.type === 'add-examples-to-word'"
      :word-id="screen.wordId"
      @done="onDone"
    />
  </template>
</template>
