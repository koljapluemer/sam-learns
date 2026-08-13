<script setup lang="ts">
import { RouterLink } from 'vue-router'
import PageShell from '@/shared/shell/PageShell.vue'
import AppInfoText from '@/shared/shell/AppInfoText.vue'
</script>

<template>
  <PageShell title="Vietnamese Typing Practice">
    <div class="text-center">
      <p class="opacity-70">
        Practice Vietnamese TELEX/VNI keyboard input.
      </p>
      <p class="mt-2 text-sm opacity-80">
        Type Vietnamese words shown on screen against a fixed word list,
        optionally using TELEX or VNI keystroke input (configurable in
        Settings) to practice composing diacritics.
      </p>
      <div class="mt-6">
        <RouterLink
          :to="{ name: 'typingpractice-practice' }"
          class="btn btn-primary"
        >
          Start practicing
        </RouterLink>
      </div>
    </div>

    <hr class="border-base-300">
    <AppInfoText />
  </PageShell>
</template>
