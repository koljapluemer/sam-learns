<script setup lang="ts">
defineProps<{
  open: boolean
  licenseName: string
  licenseUrl: string
  licenseSummary: string
}>()

const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <dialog
    class="modal"
    :class="{ 'modal-open': open }"
  >
    <div class="modal-box flex max-w-lg flex-col gap-3">
      <h3 class="text-lg font-semibold">
        {{ licenseName }}
      </h3>
      <p class="text-sm text-base-content/70">
        {{ licenseSummary }}
      </p>
      <a
        class="link"
        :href="licenseUrl"
        target="_blank"
        rel="noopener"
      >
        View full license text
      </a>
      <div class="modal-action mt-0">
        <button
          type="button"
          class="btn"
          @click="emit('close')"
        >
          Close
        </button>
      </div>
    </div>
    <form
      method="dialog"
      class="modal-backdrop"
      @submit.prevent="emit('close')"
    >
      <button>close</button>
    </form>
  </dialog>
</template>
