<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Rating } from 'ts-fsrs'
import { useAppI18n } from '@/apps/entity-relation-intuition/app/i18n'
import { localize } from '@/apps/entity-relation-intuition/dumb/localizeText'
import MermaidDiagram from '@/apps/entity-relation-intuition/dumb/MermaidDiagram.vue'
import ConfidenceRatingButtons from '@/apps/entity-relation-intuition/dumb/ConfidenceRatingButtons.vue'
import type { Scenario } from '@/apps/entity-relation-intuition/entities/scenario-content/scenarioContent'

const props = defineProps<{
  scenario: Scenario
}>()

const emit = defineEmits<{
  rated: [scenarioId: string, rating: Rating]
}>()

const { t, locale } = useAppI18n()

const isRevealed = ref(false)

const prompt = computed(() => localize(props.scenario.prompt, locale.value))
const exampleDiagrams = computed(() => props.scenario.examples.map((example) => localize(example.diagram, locale.value)))

const ratingLabels = computed(() => ({
  again: t('rating.again'),
  hard: t('rating.hard'),
  good: t('rating.good'),
  easy: t('rating.easy')
}))

function reveal() {
  isRevealed.value = true
}

function handleRate(rating: Rating) {
  emit('rated', props.scenario.id, rating)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="card border border-base-300 bg-base-100 shadow-sm">
      <div class="card-body">
        <div class="card-title">
          {{ t('exerciseprompt') }}
        </div>

        <p class="text-lg">
          {{ prompt }}
        </p>
      </div>
    </div>

    <button
      v-if="!isRevealed"
      type="button"
      class="btn btn-primary self-center"
      @click="reveal"
    >
      {{ t('exercise.revealButton') }}
    </button>

    <template v-else>
      <h2 class="text-center text-sm font-medium text-base-content/70">
        {{ t('exercise.examplesHeading') }}
      </h2>

      <div
        v-for="(diagram, index) in exampleDiagrams"
        :key="index"
        class="card border border-base-300 bg-base-100 shadow-sm"
      >
        <div class="card-body">
          <MermaidDiagram :code="diagram" />
        </div>
      </div>

      <h2 class="text-center text-sm font-medium text-base-content/70">
        {{ t('exercise.rateHeading') }}
      </h2>
      <ConfidenceRatingButtons
        :labels="ratingLabels"
        @rate="handleRate"
      />
    </template>
  </div>
</template>
