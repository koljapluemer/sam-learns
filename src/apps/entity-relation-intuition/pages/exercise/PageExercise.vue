<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Rating } from 'ts-fsrs'
import { useAppI18n } from '@/apps/entity-relation-intuition/app/i18n'
import { loadNextScenario, submitRating } from '@/apps/entity-relation-intuition/entities/progress/progressScheduler'
import type { Scenario } from '@/apps/entity-relation-intuition/entities/scenario-content/scenarioContent'
import ScenarioExerciseView from './ScenarioExerciseView.vue'

type PageState = { mode: 'loading' } | { mode: 'no-scenarios' } | { mode: 'exercise'; scenario: Scenario }

const { t } = useAppI18n()

const state = ref<PageState>({ mode: 'loading' })

onMounted(loadNext)

async function loadNext() {
  state.value = { mode: 'loading' }
  const scenario = await loadNextScenario()
  state.value = scenario ? { mode: 'exercise', scenario } : { mode: 'no-scenarios' }
}

async function handleRated(scenarioId: string, rating: Rating) {
  await submitRating(scenarioId, rating)
  await loadNext()
}
</script>

<template>
  <section class="flex w-full max-w-3xl flex-col gap-4">
    <div
      v-if="state.mode === 'loading'"
      class="flex justify-center py-16 text-sm text-base-content/70"
    >
      {{ t('loading.label') }}
    </div>

    <div
      v-else-if="state.mode === 'no-scenarios'"
      class="flex flex-col items-center gap-2 py-16 text-center text-sm text-base-content/70"
    >
      <p>{{ t('noScenarios.title') }}</p>
      <p>{{ t('noScenarios.subtitle') }}</p>
    </div>

    <ScenarioExerciseView
      v-else
      :key="state.scenario.id"
      :scenario="state.scenario"
      @rated="handleRated"
    />
  </section>
</template>
