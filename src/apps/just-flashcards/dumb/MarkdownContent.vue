<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { renderMarkdown } from './renderMarkdown'

const props = defineProps<{ source: string }>()
const content = ref<HTMLElement | null>(null)

watchEffect(() => {
  if (content.value) content.value.innerHTML = renderMarkdown(props.source)
})
</script>

<template>
  <div
    ref="content"
    class="max-w-none break-words [&_a]:link [&_blockquote]:border-l-4 [&_blockquote]:border-base-300 [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-base-200 [&_code]:px-1 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_p+p]:mt-3 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-base-200 [&_pre]:p-3 [&_pre_code]:p-0 [&_ul]:list-disc"
  />
</template>
