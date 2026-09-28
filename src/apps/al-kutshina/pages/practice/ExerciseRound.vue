<script setup lang="ts">
import type { Item } from '../../entities/item/item'
import ExerciseBoard from './ExerciseBoard.vue'
import QuestPrompt from './QuestPrompt.vue'
import type { Exercise } from './generateExercise'
import { useExerciseRound } from './useExerciseRound'

const props = defineProps<{
  exercise: Exercise
  itemsByImg: Map<string, Item>
  text: string
  audioUrl: string
}>()

const emit = defineEmits<{ done: [] }>()

const { fields, state, drop } = useExerciseRound(props.exercise, props.itemsByImg, () => emit('done'))
</script>

<template>
  <div
    class="flex flex-col gap-6 rounded-box p-4 transition-colors"
    :class="{ 'bg-success/20': state === 'correct', 'bg-error/20': state === 'wrong' }"
  >
    <ExerciseBoard
      :fields="fields"
      @drop="drop"
    />
    <QuestPrompt
      :text="text"
      :audio-url="audioUrl"
    />
  </div>
</template>
