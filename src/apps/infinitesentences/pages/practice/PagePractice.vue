<script setup lang="ts">
// Port of linguanodon's infinitesentences app/practiceApp.js.
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { usePracticeSession } from '../../app/usePracticeSession'
import { createLanguagePreferencesStore } from '../../app/store'
import { loadLanguages } from '../../app/api'
import { logActivity } from '@/shared/activity/useLearningEvent'
import MemorizeTask from '../../app/tasks/MemorizeTask.vue'
import RecallTask from '../../app/tasks/RecallTask.vue'
import UnderstandTask from '../../app/tasks/UnderstandTask.vue'
import ChallengeTask from '../../app/tasks/ChallengeTask.vue'
import type { ChallengeTaskData, MemorizeTaskData, RecallTaskData, UnderstandTaskData } from '../../app/types'

const route = useRoute()
const nativeIso = computed(() => (typeof route.params.nativeIso === 'string' ? route.params.nativeIso : ''))
const targetIso = computed(() => (typeof route.params.targetIso === 'string' ? route.params.targetIso : ''))

const session = usePracticeSession(nativeIso.value, targetIso.value)

const nativeLabel = ref(nativeIso.value)
const targetLabel = ref(targetIso.value)

function handleTaskDone(rememberedCorrectly?: boolean): void {
  // Only recall/challenge tasks are actual reviews (memorize/understand are
  // just vocab intro exposure), matching linguanodon's store.js which only
  // called queueEvent from recordGlossReview/markSentenceLearned.
  const kind = session.currentTask.value?.kind
  if (kind === 'recall' || kind === 'challenge') void logActivity('infinitesentences')
  session.handleTaskDone(rememberedCorrectly)
}

onMounted(async () => {
  createLanguagePreferencesStore().setLanguages(nativeIso.value, targetIso.value)
  void session.loadPractice()

  try {
    const languages = await loadLanguages()
    const native = languages.find((language) => language.code === nativeIso.value)
    const target = languages.find((language) => language.code === targetIso.value)
    if (native) nativeLabel.value = native.symbols[0] || native.displayName
    if (target) targetLabel.value = target.symbols[0] || target.displayName
  } catch (error) {
    console.warn('Failed to load language display info:', error)
  }
})
</script>

<template>
  <div class="text-center text-sm opacity-70 py-1">
    Learning: {{ nativeLabel }} <span aria-hidden="true">&rarr;</span> {{ targetLabel }}
  </div>

  <div class="w-full h-0.5">
    <div
      :class="session.goalReached.value ? 'bg-success' : 'bg-primary'"
      class="h-full transition-all duration-300"
      :style="{ width: session.progressPercent.value + '%' }"
    />
  </div>

  <div
    v-if="session.isLoading.value"
    class="flex justify-center py-6"
  >
    <span class="loading loading-spinner loading-lg" />
  </div>

  <div
    v-else-if="session.errorMessage.value"
    class="alert alert-warning m-4"
  >
    <span>{{ session.errorMessage.value }}</span>
  </div>

  <div
    v-else
    class="w-full flex justify-around flex-1 relative p-4"
  >
    <MemorizeTask
      v-if="session.currentTask.value?.kind === 'memorize'"
      :task="(session.currentTask.value.data as MemorizeTaskData)"
      @task-done="handleTaskDone"
    />
    <UnderstandTask
      v-else-if="session.currentTask.value?.kind === 'understand'"
      :task="(session.currentTask.value.data as UnderstandTaskData)"
      @task-done="handleTaskDone"
    />
    <RecallTask
      v-else-if="session.currentTask.value?.kind === 'recall'"
      :task="(session.currentTask.value.data as RecallTaskData)"
      @task-done="handleTaskDone"
    />
    <ChallengeTask
      v-else-if="session.currentTask.value?.kind === 'challenge'"
      :task="(session.currentTask.value.data as ChallengeTaskData)"
      @task-done="handleTaskDone"
    />
    <div
      v-else
      class="flex justify-center py-6"
    >
      <span class="loading loading-spinner loading-lg" />
    </div>
  </div>
</template>
