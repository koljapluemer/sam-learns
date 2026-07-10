<script setup lang="ts">
import { computed } from 'vue'
import { arcPath } from '@/apps/triangle-congruence/entities/triangle/triangleGeometry'
import type { TriangleFigureData } from '@/apps/triangle-congruence/entities/triangle/triangleTypes'

const props = withDefaults(
  defineProps<{
    figure: TriangleFigureData
    viewBoxSize?: number
    sideColor?: string
    angleColor?: string
  }>(),
  {
    viewBoxSize: 200,
    sideColor: '#4CAF50',
    angleColor: '#2196F3'
  }
)

const pointsAttr = computed(() => props.figure.points.map((point) => `${point.x},${point.y}`).join(' '))
</script>

<template>
  <svg
    :viewBox="`0 0 ${viewBoxSize} ${viewBoxSize}`"
    :width="viewBoxSize"
    :height="viewBoxSize"
  >
    <g>
      <path
        v-for="(arc, index) in figure.highlightedAngles"
        :key="index"
        :d="arcPath(arc.p1, arc.p2, arc.radius, arc.sweepFlag)"
        fill="none"
        :stroke="angleColor"
        stroke-width="2"
      />
      <polygon
        :points="pointsAttr"
        fill="none"
        stroke="black"
        stroke-width="5"
      />
      <line
        v-for="(side, index) in figure.highlightedSides"
        :key="index"
        :x1="side.from.x"
        :y1="side.from.y"
        :x2="side.to.x"
        :y2="side.to.y"
        :stroke="sideColor"
        stroke-width="5"
      />
    </g>
  </svg>
</template>
