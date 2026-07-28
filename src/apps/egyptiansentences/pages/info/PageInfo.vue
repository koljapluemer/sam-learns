<script setup lang="ts">
import { RouterLink } from 'vue-router'
import PageShell from '@/shared/shell/PageShell.vue'
</script>

<template>
  <PageShell title="Basic Egyptian Sentences">
    <div class="text-center">
      <p class="opacity-70">
        Timed cloze-word quiz for Egyptian Arabic sentences.
      </p>
      <p class="mt-2 text-sm opacity-80">
        A timed cloze-word quiz: you'll get a sentence with a word blanked
        out and pick the right word from a set of choices before the clock runs
        out. Streaks and time bonuses build your score, and your best runs are
        kept as a local highscore list.
      </p>
      <div class="mt-6">
        <RouterLink
          :to="{ name: 'egyptiansentences-practice' }"
          class="btn btn-primary"
        >
          Start practicing
        </RouterLink>
      </div>
    </div>
  </PageShell>
</template>
