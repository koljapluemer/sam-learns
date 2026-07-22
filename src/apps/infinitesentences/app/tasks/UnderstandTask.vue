<script setup lang="ts">
// Port of linguanodon's infinitesentences app/tasks/UnderstandTask.js.
import { computed, ref, watch } from 'vue'
import IndexCard from '../elements/IndexCard.vue'
import InteractionButtonRow from '../elements/InteractionButtonRow.vue'
import ShowInstruction from '../elements/ShowInstruction.vue'
import type { IndexCardRow, UnderstandTaskData } from '../types'

const props = defineProps<{ task: UnderstandTaskData }>()
const emit = defineEmits<{ 'task-done': [] }>()

const phase = ref<'question' | 'answer'>('question')
const mainFlipped = ref(false)
const swipeExamples = ref(false)

const glossRow = computed<IndexCardRow>(() => ({
  type: 'text',
  text: props.task.gloss.content,
  size: 'auto',
  subtext: props.task.gloss.transcription
}))

const questionCard = computed<IndexCardRow[]>(() => [glossRow.value])

const finalCard = computed<IndexCardRow[]>(() => {
  const translationRows: IndexCardRow[] = props.task.translations.map((translation) => ({
    type: 'text',
    text: translation.content,
    size: 'auto'
  }))
  return [glossRow.value, { type: 'divider' }, ...translationRows]
})

function flip(): void {
  mainFlipped.value = true
  swipeExamples.value = true
  phase.value = 'answer'
}

function finish(): void {
  emit('task-done')
}

function resetState(): void {
  phase.value = 'question'
  mainFlipped.value = false
  swipeExamples.value = false
}

watch(() => props.task.gloss.content, resetState)
</script>

<template>
  <div class="w-full max-w-3xl flex flex-col min-h-[70vh] gap-4">
    <div>
      <ShowInstruction
        v-if="phase === 'question'"
        content="What do you think this means?"
      />
    </div>

    <div class="flex-1 flex flex-col gap-4 overflow-auto">
      <IndexCard
        :rows="phase === 'question' ? questionCard : finalCard"
        :flipped="mainFlipped"
        fill
      />

      <div
        v-if="phase === 'question'"
        class="grid gap-3"
      >
        <IndexCard
          v-for="(pair, index) in task.examples"
          :key="pair.example.ref ?? pair.example.content ?? index"
          :rows="[
            { type: 'text', text: pair.translation.content, size: 'normal' },
            { type: 'divider' },
            { type: 'text', text: pair.example.content, size: 'normal' }
          ]"
          :swiped="swipeExamples"
        />
      </div>
    </div>

    <div class="mt-auto flex justify-center">
      <InteractionButtonRow
        v-if="phase === 'question'"
        :icons="['RefreshCw']"
        @select="flip"
      />
      <InteractionButtonRow
        v-else
        :icons="['Check']"
        @select="finish"
      />
    </div>
  </div>
</template>
