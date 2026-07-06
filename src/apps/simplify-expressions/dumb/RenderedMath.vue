<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import katex from 'katex'
import { toDisplayLatex } from '@/apps/simplify-expressions/entities/expression-exercise/exerciseDisplay'

const props = defineProps<{
  expression: string
}>()

const mathContainer = ref<HTMLElement | null>(null)

onMounted(renderMath)

watch(
  () => props.expression,
  () => renderMath()
)

function renderMath() {
  if (!mathContainer.value) return

  try {
    katex.render(toDisplayLatex(props.expression), mathContainer.value, {
      displayMode: true,
      throwOnError: false
    })
  } catch {
    katex.render(props.expression, mathContainer.value, {
      displayMode: true,
      throwOnError: false
    })
  }
}
</script>

<template>
  <div
    ref="mathContainer"
    class="overflow-x-auto rounded-box bg-base-200 px-4 py-5 text-2xl"
  />
</template>
