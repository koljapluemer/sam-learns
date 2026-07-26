<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  values: number[]
  highlightValue?: number | null
}>()

const width = 400
const height = 200
const margin = 24

const errorValues = computed(() => {
  const values = [...props.values]
  if (props.highlightValue != null) values.push(props.highlightValue)
  return values.length ? values : [-10, 10]
})

const maxX = computed(() => Math.max(20, props.values.length))
const maxY = computed(() => Math.ceil(Math.max(...errorValues.value) / 10) * 10)
const minY = computed(() => Math.floor(Math.min(...errorValues.value) / 10) * 10)

const scaleX = computed(() => {
  const xRange = maxX.value
  return (x: number) => (x / xRange) * (width - 2 * margin) + margin
})

const scaleY = computed(() => {
  const yRange = maxY.value - minY.value || 1
  return (y: number) => height - ((y - minY.value) / yRange) * (height - 2 * margin) - margin
})
</script>

<template>
  <svg
    :viewBox="`0 0 ${width} ${height}`"
    class="h-auto w-full"
    preserveAspectRatio="xMidYMid meet"
  >
    <line
      :x1="margin"
      :y1="scaleY(0)"
      :x2="width - margin"
      :y2="scaleY(0)"
      class="stroke-base-content/20"
      stroke-width="1"
    />
    <circle
      v-for="(value, index) in values"
      :key="index"
      :cx="scaleX(index)"
      :cy="scaleY(value)"
      r="4"
      class="fill-primary"
    />
    <circle
      v-if="highlightValue != null"
      :cx="scaleX(values.length)"
      :cy="scaleY(highlightValue)"
      r="5"
      fill="white"
    />
  </svg>
</template>
