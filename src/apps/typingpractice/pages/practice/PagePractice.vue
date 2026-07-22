<script setup lang="ts">
import { useTypingSession } from '../../app/useTypingSession'

const session = useTypingSession()

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  const isComposing = (event as InputEvent).isComposing ?? false
  session.handleInput(target.value, isComposing)
}
</script>

<template>
  <div
    v-if="session.loadError.value"
    class="alert alert-error max-w-3xl mx-auto"
  >
    <span>{{ session.loadError.value }}</span>
  </div>

  <div
    v-else-if="session.loading.value"
    class="flex min-h-64 items-center justify-center w-full"
  >
    <span class="loading loading-spinner loading-lg" />
  </div>

  <div
    v-else
    class="flex flex-col items-center justify-center gap-6 p-4"
  >
    <div class="stats shadow bg-base-100">
      <div class="stat place-items-center">
        <div class="stat-title">
          WPM
        </div>
        <div class="stat-value text-primary">
          {{ session.wpm.value }}
        </div>
      </div>
      <div class="stat place-items-center">
        <div class="stat-title">
          Accuracy
        </div>
        <div class="stat-value text-secondary">
          {{ session.accuracy.value }}%
        </div>
      </div>
      <div class="stat place-items-center">
        <div class="stat-title">
          Time
        </div>
        <div class="stat-value">
          {{ session.elapsedSeconds.value }}
        </div>
      </div>
    </div>

    <div class="card bg-base-100 shadow-xl w-full max-w-3xl">
      <div class="card-body">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div
          class="flex flex-col gap-6 select-none"
          v-html="session.lineHtml.value"
        />
      </div>
    </div>

    <input
      type="text"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      class="input input-bordered input-lg w-full max-w-3xl text-center"
      placeholder="Start typing..."
      autofocus
      :value="session.inputValue.value"
      @input="onInput"
    >
  </div>
</template>
