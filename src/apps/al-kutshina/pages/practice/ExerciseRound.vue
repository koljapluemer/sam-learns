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

const { fields, state, statuses, drop } = useExerciseRound(props.exercise, props.itemsByImg, () => emit('done'))
</script>

<template>
  <div class="flex flex-col gap-6">
    <QuestPrompt
      :text="text"
      :audio-url="audioUrl"
      :solved="state === 'correct'"
    />
    <ExerciseBoard
      :fields="fields"
      :statuses="statuses"
      :locked="state !== 'waiting'"
      @drop="drop"
    />
  </div>
</template>
