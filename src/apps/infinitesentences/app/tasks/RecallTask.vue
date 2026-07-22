<script setup lang="ts">
// Port of linguanodon's infinitesentences app/tasks/RecallTask.js.
import { computed, ref, watch } from 'vue'
import IndexCard from '../elements/IndexCard.vue'
import InteractionButtonRow from '../elements/InteractionButtonRow.vue'
import ShowInstruction from '../elements/ShowInstruction.vue'
import type { IndexCardRow, RecallTaskData } from '../types'

const props = defineProps<{ task: RecallTaskData }>()
const emit = defineEmits<{ 'task-done': [rememberedCorrectly?: boolean] }>()

const phase = ref<'prompt' | 'reveal'>('prompt')
const flipped = ref(false)

const cardRows = computed<IndexCardRow[]>(() => {
  const glossRow: IndexCardRow = {
    type: 'text',
    text: props.task.gloss.content,
    size: 'auto',
    subtext: props.task.gloss.transcription
  }
  if (phase.value === 'prompt') return [glossRow]

  const translationRows: IndexCardRow[] = props.task.translations.map((translation) => ({
    type: 'text',
    text: translation.content,
    size: 'auto'
  }))
  return [glossRow, { type: 'divider' }, ...translationRows]
})

function handleFlip(): void {
  flipped.value = true
  phase.value = 'reveal'
}

function handleDone(icon: string): void {
  emit('task-done', icon === 'Check')
}

function resetState(): void {
  phase.value = 'prompt'
  flipped.value = false
}

watch(() => props.task.gloss.content, resetState)
</script>

<template>
  <div class="w-full max-w-xl flex flex-col min-h-[70vh] gap-4">
    <div>
      <ShowInstruction
        v-if="phase === 'prompt'"
        content="Do you remember what this means?"
      />
    </div>

    <div class="flex-1 flex flex-col gap-4 items-center overflow-auto">
      <IndexCard
        :rows="cardRows"
        :flipped="flipped"
        fill
      />
    </div>

    <div class="mt-auto flex justify-center">
      <InteractionButtonRow
        v-if="phase === 'prompt'"
        :icons="['RefreshCw']"
        @select="handleFlip"
      />
      <InteractionButtonRow
        v-else
        :icons="['Check', 'X']"
        @select="handleDone"
      />
    </div>
  </div>
</template>
