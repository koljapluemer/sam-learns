<script setup lang="ts">
import { ref } from 'vue'
import { useAppI18n } from '@/apps/triangle-congruence/app/i18n'
import TriangleFigure from '@/apps/triangle-congruence/dumb/TriangleFigure.vue'
import TheoremOptionButton from '@/apps/triangle-congruence/dumb/TheoremOptionButton.vue'
import type { IdentifyTheoremExercise, TriangleTheorem } from '@/apps/triangle-congruence/entities/triangle/triangleTypes'

const props = defineProps<{
  topicId: TriangleTheorem
  showExplanations: boolean
  exercise: IdentifyTheoremExercise
}>()

const emit = defineEmits<{
  submitted: [topicId: TriangleTheorem, selectedTheorem: TriangleTheorem]
}>()

const { t } = useAppI18n()

const optionOrder: TriangleTheorem[] = ['sws', 'sss', 'wsw', 'ssw']

const selected = ref<TriangleTheorem | null>(null)

function isCorrectForOption(theorem: TriangleTheorem): boolean | null {
  if (selected.value === null) return null
  if (theorem === props.exercise.theorem) return true
  if (theorem === selected.value) return false
  return null
}

function handleClick(theorem: TriangleTheorem) {
  if (selected.value !== null) return
  selected.value = theorem
  window.setTimeout(() => {
    emit('submitted', props.topicId, theorem)
  }, 900)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-center text-lg font-semibold">
      {{ t('identifyTheorem.heading') }}
    </h1>

    <div class="flex items-center justify-center gap-6">
      <TriangleFigure :figure="exercise.figure1" />
      <TriangleFigure :figure="exercise.figure2" />
    </div>

    <h2 class="text-center text-sm font-medium text-base-content/70">
      {{ t('identifyTheorem.chooseHeading') }}
    </h2>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <TheoremOptionButton
        v-for="theorem in optionOrder"
        :key="theorem"
        :title="t(`identifyTheorem.options.${theorem}.title`)"
        :explanation="showExplanations ? t(`identifyTheorem.options.${theorem}.explanation`) : undefined"
        :selected="selected === theorem"
        :is-correct="isCorrectForOption(theorem)"
        :disabled="selected !== null"
        @click="handleClick(theorem)"
      />
    </div>
  </div>
</template>
