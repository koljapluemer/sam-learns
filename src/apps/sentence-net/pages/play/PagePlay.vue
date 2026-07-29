<script setup lang="ts">
import { ref } from 'vue'
import { Brain, Layers, List, PlusCircle } from 'lucide-vue-next'
import { useActiveTime } from '@/shared/activity/useActiveTime'
import BottomDock, { type DockItem } from '@/shared/shell/BottomDock.vue'
import QueueView from './QueueView.vue'
import SentenceListView from './SentenceListView.vue'
import WordListView from './WordListView.vue'
import type { ScreenState } from './useQueueSelection'

export type PlayView = 'queue' | 'sentences' | 'words'

useActiveTime('sentence-net')

const view = ref<PlayView>('queue')
const pendingForce = ref<ScreenState | undefined>(undefined)
const queueViewRef = ref<InstanceType<typeof QueueView> | null>(null)

const items: DockItem[] = [
  { key: 'queue', icon: Brain, label: 'Queue' },
  { key: 'add-sentence', icon: PlusCircle, label: 'Add sentence' },
  { key: 'sentences', icon: List, label: 'Sentences' },
  { key: 'words', icon: Layers, label: 'Vocab' }
]

function goToQueueScreen(target: ScreenState): void {
  if (view.value === 'queue' && queueViewRef.value) {
    queueViewRef.value.force(target)
    return
  }
  pendingForce.value = target
  view.value = 'queue'
}

function selectTab(next: string): void {
  if (next === 'add-sentence') {
    goToQueueScreen({ type: 'new-example-sentence' })
    return
  }
  pendingForce.value = undefined
  view.value = next as PlayView
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

    <BottomDock
      :model-value="view"
      :items="items"
      @update:model-value="selectTab"
    />
  </div>
</template>
