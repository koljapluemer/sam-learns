<script setup lang="ts">
import { shellState } from '@/shared/shell/shellState'
import ThemeToggle from '@/shared/theme/ThemeToggle.vue'
import LanguageSwitcher from '@/shared/shell/LanguageSwitcher.vue'

defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <dialog
    class="modal"
    :class="{ 'modal-open': isOpen }"
  >
    <div class="modal-box">
      <h3 class="text-lg font-bold">
        Settings
      </h3>

      <div class="mt-4 flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium">Theme</span>
          <ThemeToggle />
        </div>

        <div
          v-if="shellState.locales.length > 1"
          class="flex items-center justify-between"
        >
          <span class="text-sm font-medium">Language</span>
          <LanguageSwitcher />
        </div>
      </div>

      <div
        v-if="shellState.settings"
        class="mt-6 border-t border-base-300 pt-4"
      >
        <h4 class="mb-2 text-sm font-semibold text-base-content/70">
          This app
        </h4>
        <component :is="shellState.settings" />
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
