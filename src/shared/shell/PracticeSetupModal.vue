<script setup lang="ts">
// The one standardized "set this before you can practice" modal. An app's
// main page renders it when a required setting (usually the target language)
// is missing, puts every such setting in the default slot, and starts
// practice once `ready` is true and the user hits the start button.
withDefaults(
  defineProps<{
    open: boolean
    // False while a required setting is still missing - blocks dismissal.
    ready: boolean
    title?: string
    startLabel?: string
  }>(),
  { title: 'Before you start', startLabel: 'Start' }
)

const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <dialog
    class="modal"
    :class="{ 'modal-open': open }"
  >
    <div class="modal-box flex max-w-lg flex-col gap-4">
      <h3 class="text-lg font-semibold">
        {{ title }}
      </h3>

      <slot />

      <div class="modal-action mt-0">
        <button
          type="button"
          class="btn btn-primary"
          :disabled="!ready"
          @click="emit('close')"
        >
          {{ startLabel }}
        </button>
      </div>
    </div>
    <form
      v-if="ready"
      method="dialog"
      class="modal-backdrop"
      @submit.prevent="emit('close')"
    >
      <button>close</button>
    </form>
  </dialog>
</template>
