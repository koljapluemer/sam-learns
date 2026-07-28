<script setup lang="ts">
import { ref } from 'vue'
import { useActiveTime } from '@/shared/activity/useActiveTime'
import PlayDock, { type PlayView } from './PlayDock.vue'
import QueueView from './QueueView.vue'
import SentenceListView from './SentenceListView.vue'
import WordListView from './WordListView.vue'
import type { ScreenState } from './useQueueSelection'

useActiveTime('sentence-net')

const view = ref<PlayView>('queue')
const pendingForce = ref<ScreenState | undefined>(undefined)
const queueViewRef = ref<InstanceType<typeof QueueView> | null>(null)

function goToQueueScreen(target: ScreenState): void {
  if (view.value === 'queue' && queueViewRef.value) {
    queueViewRef.value.force(target)
    return
  }
  pendingForce.value = target
  view.value = 'queue'
}

function selectTab(next: PlayView): void {
  pendingForce.value = undefined
  view.value = next
}
</script>

<template>
  <div class="pb-24">
    <QueueView
      v-if="view === 'queue'"
      ref="queueViewRef"
      :initial-screen="pendingForce"
    />
    <SentenceListView
      v-else-if="view === 'sentences'"
      @edit="(sentenceId) => goToQueueScreen({ type: 'add-sentence-vocab', sentenceId })"
    />
    <WordListView
      v-else
      @edit="(wordId) => goToQueueScreen({ type: 'add-examples-to-word', wordId })"
    />

    <PlayDock
      :model-value="view"
      @update:model-value="selectTab"
      @add-sentence="goToQueueScreen({ type: 'new-example-sentence' })"
    />
  </div>
</template>
