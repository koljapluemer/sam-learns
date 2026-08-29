<script setup lang="ts">
// Port of linguanodon's infinitesentences app/practiceApp.js.
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { usePracticeSession } from '../../app/usePracticeSession'
import { createLanguagePreferencesStore } from '../../app/store'
import { loadLanguages } from '../../app/api'
import { logActivity } from '@/shared/activity/useLearningEvent'
import { useActiveTime } from '@/shared/activity/useActiveTime'
import MemorizeTask from '../../app/tasks/MemorizeTask.vue'
import RecallTask from '../../app/tasks/RecallTask.vue'
import UnderstandTask from '../../app/tasks/UnderstandTask.vue'
import ChallengeTask from '../../app/tasks/ChallengeTask.vue'
import type { ChallengeTaskData, MemorizeTaskData, RecallTaskData, UnderstandTaskData } from '../../app/types'

const route = useRoute()
const nativeIso = computed(() => (typeof route.params.nativeIso === 'string' ? route.params.nativeIso : ''))
const targetIso = computed(() => (typeof route.params.targetIso === 'string' ? route.params.targetIso : ''))

const session = usePracticeSession(nativeIso.value, targetIso.value)
useActiveTime('infinitesentences')

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
  <main class="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 px-4 pb-8">
    <p class="text-center text-sm opacity-70">
      Learning: {{ nativeLabel }} <span aria-hidden="true">&rarr;</span> {{ targetLabel }}
    </p>

    <div class="h-1 w-full overflow-hidden rounded-full bg-base-200">
      <div
        class="h-full transition-all duration-300"
        :class="session.goalReached.value ? 'bg-success' : 'bg-primary'"
        :style="{ width: session.progressPercent.value + '%' }"
      />
    </div>

    <div
      v-if="session.isLoading.value"
      class="flex flex-1 items-center justify-center py-6"
    >
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div
      v-else-if="session.errorMessage.value"
      class="alert alert-warning"
    >
      <span>{{ session.errorMessage.value }}</span>
    </div>

    <div
      v-else
      class="flex flex-1 justify-center"
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
        class="flex flex-1 items-center justify-center py-6"
      >
        <span class="loading loading-spinner loading-lg" />
      </div>
    </div>
  </main>
</template>
