<script setup lang="ts">
// Port of linguanodon's infinitesentences app/elements/InteractionButtonRow.js.
// The original resolves icons dynamically by name from a lucide UMD CDN
// build and injects raw SVG via v-html; this repo has lucide-vue-next as a
// real dependency, so icon names map straight to components instead.
import { Check, CheckCheck, RefreshCw, SkipForward, X, type LucideIcon } from 'lucide-vue-next'

const props = defineProps<{
  icons: string[]
}>()

const emit = defineEmits<{
  select: [icon: string]
}>()

const ICONS: Record<string, LucideIcon> = {
  SkipForward,
  RefreshCw,
  Check,
  X,
  CheckCheck
}

function iconComponent(icon: string): LucideIcon | undefined {
  return ICONS[icon]
}
</script>

<template>
  <div class="flex gap-2 justify-center">
    <button
      v-for="icon in props.icons"
      :key="icon"
      class="btn btn-circle btn-outline btn-xl"
      type="button"
      @click="emit('select', icon)"
    >
      <component
        :is="iconComponent(icon)"
        class="w-6 h-6"
      />
    </button>
  </div>
</template>
