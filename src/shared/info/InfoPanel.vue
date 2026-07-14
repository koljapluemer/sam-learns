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
    <div class="modal-box">
      <h3 class="text-lg font-bold">
        About
      </h3>

      <div
        v-if="shellState.about"
        class="mt-4"
      >
        <component :is="shellState.about" />
      </div>

      <div class="mt-4 flex flex-col items-center gap-4 text-center text-sm text-base-content/70">
        <p class="flex flex-row items-center gap-4">
          <span>
            Made with ♥ by <a
              href="https://koljapluemer.com"
              target="_blank"
              rel="noopener noreferrer"
              class="link"
            >Kolja Sam</a>
          </span>
          <a
            href="https://ko-fi.com/S6S81CWUVD"
            target="_blank"
          ><img
            height="36"
            style="border:0px;height:36px;"
            src="https://storage.ko-fi.com/cdn/kofi4.png?v=6"
            border="0"
            alt="Buy Me a Coffee at ko-fi.com"
          ></a>
        </p>

        <p>
          I'm using the privacy-friendly <a
            href="https://www.goatcounter.com"
            target="_blank"
            rel="noopener noreferrer"
            class="link"
          >Goatcounter</a> to track page views and I store some pseudonymous learning data. No
          personal data is collected, and cookies are used solely for tracking your learning progress on your
          device. This app is
          <a
            href="https://github.com/koljapluemer/sam-learns-things"
            target="_blank"
            rel="noopener noreferrer"
            class="link"
          >open source</a>.
        </p>
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
