<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { Brain, List } from 'lucide-vue-next'
import { useActiveTime } from '@/shared/activity/useActiveTime'
import BottomDock, { type DockItem } from '@/shared/shell/BottomDock.vue'
import FlashcardListView from './FlashcardListView.vue'
import PracticeQueueView from './PracticeQueueView.vue'

useActiveTime('just-flashcards')

type View = 'practice' | 'manage'

const view = ref<View>('practice')
const listRef = ref<InstanceType<typeof FlashcardListView> | null>(null)
const items: DockItem[] = [
  { key: 'practice', icon: Brain, label: 'Queue' },
  { key: 'manage', icon: List, label: 'Cards' }
]

async function addCard(): Promise<void> {
  view.value = 'manage'
  await nextTick()
  listRef.value?.openAdd()
}
</script>

<template>
  <div class="pb-24">
    <PracticeQueueView
      v-if="view === 'practice'"
      @add-card="addCard"
    />
    <FlashcardListView
      v-else
      ref="listRef"
    />
    <BottomDock
      :model-value="view"
      :items="items"
      @update:model-value="(next) => (view = next as View)"
    />
  </div>
</template>
