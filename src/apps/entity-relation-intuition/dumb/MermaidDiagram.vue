<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import mermaid from 'mermaid'

let initialized = false

function ensureInitialized() {
  if (initialized) return
  mermaid.initialize({ startOnLoad: false, theme: 'default' })
  initialized = true
}

const props = defineProps<{
  code: string
}>()

const svgHtml = ref('')
const errored = ref(false)
let renderCount = 0

async function render() {
  ensureInitialized()
  renderCount += 1
  const id = `erd-diagram-${renderCount}-${Math.random().toString(36).slice(2)}`

  try {
    const { svg } = await mermaid.render(id, props.code)
    svgHtml.value = svg
    errored.value = false
  } catch {
    errored.value = true
  }
}

onMounted(render)
watch(() => props.code, render)
</script>

<template>
  <div
    v-if="errored"
    class="alert alert-error text-sm"
  >
    Could not render diagram.
  </div>
  <div
    v-else
    class="w-full overflow-x-auto"
    v-html="svgHtml"
  />
</template>
