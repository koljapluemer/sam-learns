<script setup lang="ts">
// Spec explicitly asks for a single "Save" button on this form, which is an
// intentional exception to agents.md's general blur-autosave guidance.
import { X } from 'lucide-vue-next'
import { DAILY_GOAL, useAddForm } from './useAddForm'
import type { MainView } from './MainDock.vue'

const emit = defineEmits<{ 'switch-view': [view: MainView] }>()

const form = useAddForm()
</script>

<template>
  <div class="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8">
    <div>
      <div class="mb-1 flex justify-between text-sm opacity-70">
        <span>Today's words</span>
        <span>{{ form.todayCount.value }} / {{ DAILY_GOAL }}</span>
      </div>
      <progress
        class="progress progress-primary w-full"
        :value="Math.min(form.todayCount.value, DAILY_GOAL)"
        :max="DAILY_GOAL"
      />
    </div>

    <div
      v-if="form.todayCount.value >= DAILY_GOAL"
      class="alert alert-success flex-col items-start gap-2"
    >
      <span>All done! Move on to memorize.</span>
      <button
        type="button"
        class="btn btn-sm"
        @click="emit('switch-view', 'memorize')"
      >
        Go to memorize
      </button>
    </div>

    <form
      v-else
      class="flex flex-col gap-5"
      @submit.prevent="form.save"
    >
      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium">Word</span>
        <input
          v-model="form.word.value"
          type="text"
          class="input w-full"
          required
        >
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium">Meaning</span>
        <input
          v-model="form.meaning.value"
          type="text"
          class="input w-full"
          required
        >
      </label>

      <div class="flex flex-col gap-2">
        <span class="text-sm font-medium">Examples</span>
        <div
          v-for="(example, index) in form.examples.value"
          :key="index"
          class="flex items-center gap-2"
        >
          <div class="flex flex-1 flex-col gap-2">
            <input
              v-model="example.sentence"
              type="text"
              placeholder="Sentence"
              class="input input-sm w-full"
            >
            <input
              v-model="example.translation"
              type="text"
              placeholder="Translation"
              class="input input-sm w-full"
            >
          </div>
          <button
            v-if="form.examples.value.length > 1"
            type="button"
            class="btn btn-circle btn-ghost btn-sm"
            aria-label="Remove example"
            @click="form.removeExample(index)"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <span class="text-sm font-medium">Notes</span>
        <div
          v-for="(note, index) in form.notes.value"
          :key="index"
          class="flex items-center gap-2"
        >
          <input
            v-model="note.text"
            type="text"
            class="input input-sm w-full flex-1"
          >
          <button
            v-if="form.notes.value.length > 1"
            type="button"
            class="btn btn-circle btn-ghost btn-sm"
            aria-label="Remove note"
            @click="form.removeNote(index)"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <button
        type="submit"
        class="btn btn-primary"
        :disabled="form.saving.value"
      >
        Save
      </button>
    </form>
  </div>
</template>
