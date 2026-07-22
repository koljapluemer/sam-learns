<script setup lang="ts">
import { shellState } from '@/shared/shell/shellState'

defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <dialog class="modal" :class="{ 'modal-open': isOpen }">
    <div class="modal-box flex flex-col gap-2">

      <div v-if="shellState.about">
        <component :is="shellState.about" />
      </div>

      <p>
        Made with ♥ by <a href="https://koljasam.com" target="_blank" rel="noopener noreferrer" class="link">Kolja
          Sam</a>.
      </p>
      <p>
        If you want to support me building more apps like this in the future,
        <a href="https://ko-fi.com/S6S81CWUVD" target="_blank" rel="noopener" class="link">
          support my work on ko-fi
        </a>.
      </p>

      <p>
        I'm using the privacy-friendly <a href="https://www.goatcounter.com" target="_blank" rel="noopener noreferrer"
          class="link">Goatcounter</a> to track page views and I store some pseudonymous learning data. No
        personal data is collected, and cookies are used solely for tracking your learning progress on your
        device. This app is
        <a href="https://github.com/koljapluemer/sam-learns-things" target="_blank" rel="noopener noreferrer"
          class="link">open source</a>.
      </p>
    </div>

    <div class="modal-action">
      <button type="button" class="btn btn-sm" @click="emit('close')">
        Close
      </button>
    </div>
    <form method="dialog" class="modal-backdrop" @click="emit('close')">
      <button>close</button>
    </form>
  </dialog>
</template>
