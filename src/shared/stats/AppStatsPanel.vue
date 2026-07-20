<script setup lang="ts">
import { shellState } from '@/shared/shell/shellState'

defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <dialog
    class="modal"
    :class="{ 'modal-open': isOpen }"
  >
    <div class="modal-box sm:max-w-2xl">
      <h3 class="text-lg font-bold">
        Stats
      </h3>

      <div
        v-if="shellState.stats"
        class="mt-4"
      >
        <component :is="shellState.stats" />
      </div>

      <div class="modal-action">
        <button
          type="button"
          class="btn btn-sm"
          @click="emit('close')"
        >
          Close
        </button>
      </div>
    </div>
    <form
      method="dialog"
      class="modal-backdrop"
      @click="emit('close')"
    >
      <button>close</button>
    </form>
  </dialog>
</template>
