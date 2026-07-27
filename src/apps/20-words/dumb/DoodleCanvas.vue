<script setup lang="ts">
// A quick sketch pad for a mnemonic doodle. Always a white sheet with black
// ink, independent of the app theme, so drawings stay legible either way.
import { onMounted, ref, watch } from 'vue'
import { Eraser } from 'lucide-vue-next'

const props = defineProps<{ modelValue: string | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>()

const WIDTH = 280
const HEIGHT = 160

const COLORS = ['#111827', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']
const color = ref(COLORS[0])

const canvasEl = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let drawing = false

function getContext(): CanvasRenderingContext2D | null {
  if (!ctx && canvasEl.value) {
    ctx = canvasEl.value.getContext('2d')
    if (ctx) {
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
  }
  return ctx
}

function fillWhite(): void {
  const context = getContext()
  if (!context) return
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, WIDTH, HEIGHT)
}

function pointFromEvent(event: PointerEvent): { x: number; y: number } {
  const rect = canvasEl.value!.getBoundingClientRect()
  return { x: event.clientX - rect.left, y: event.clientY - rect.top }
}

function startDraw(event: PointerEvent): void {
  const context = getContext()
  if (!context) return
  drawing = true
  context.strokeStyle = color.value
  const { x, y } = pointFromEvent(event)
  context.beginPath()
  context.moveTo(x, y)
}

function draw(event: PointerEvent): void {
  if (!drawing) return
  const context = getContext()
  if (!context) return
  const { x, y } = pointFromEvent(event)
  context.lineTo(x, y)
  context.stroke()
}

function stopDraw(): void {
  if (!drawing) return
  drawing = false
  emit('update:modelValue', canvasEl.value!.toDataURL('image/png'))
}

function clear(): void {
  fillWhite()
  emit('update:modelValue', null)
}

onMounted(() => {
  fillWhite()
  if (props.modelValue) {
    const img = new Image()
    img.onload = () => getContext()?.drawImage(img, 0, 0)
    img.src = props.modelValue
  }
})

// Reacts to an external reset (e.g. the add form clearing itself after
// save) without wiping the canvas on our own emits, which carry the same
// value straight back down.
watch(
  () => props.modelValue,
  (value) => {
    if (value === null) fillWhite()
  }
)
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-start gap-3">
      <canvas
        ref="canvasEl"
        :width="WIDTH"
        :height="HEIGHT"
        class="touch-none rounded border border-base-300 bg-white"
        @pointerdown="startDraw"
        @pointermove="draw"
        @pointerup="stopDraw"
        @pointerleave="stopDraw"
      />
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="swatch in COLORS"
          :key="swatch"
          type="button"
          class="h-6 w-6 rounded-full border-2"
          :class="color === swatch ? 'border-base-content' : 'border-base-300'"
          :style="{ backgroundColor: swatch }"
          :aria-label="`Color ${swatch}`"
          :aria-pressed="color === swatch"
          @click="color = swatch"
        />
      </div>
    </div>
    <button
      type="button"
      class="btn btn-ghost btn-sm self-start"
      @click="clear"
    >
      <Eraser class="w-4 h-4" />
      Clear
    </button>
  </div>
</template>
