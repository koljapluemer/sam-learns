<script setup lang="ts">
// Ported from linguanodon's saetze app/practiceApp.js - the lesson is
// selected via a `:lessonKey` dynamic path segment (see PageHome.vue's link),
// mirroring linguanodon's own per-lesson practice URL.
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePracticeSession } from '../../app/usePracticeSession'
import { tokenizeCredit } from '../../app/credit'

const route = useRoute()
const lessonKey = computed(() => (typeof route.params.lessonKey === 'string' ? route.params.lessonKey : ''))
const session = usePracticeSession(lessonKey)

function sentenceParts() {
  const currentExercise = session.exercise.value
  if (!currentExercise) return { before: '', after: '' }
  const [before, ...rest] = currentExercise.cloze.split('＿')
  return { before, after: rest.join('＿') }
}
</script>

<template>
  <main class="mx-auto flex w-full max-w-3xl flex-1 flex-col py-8">
    <div
      v-if="session.loading.value"
      class="mt-16"
    >
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div
      v-else-if="session.loadError.value"
      class="alert alert-error mt-10 max-w-xl"
    >
      <span>{{ session.loadError.value }}</span>
    </div>

    <div
      v-else-if="session.exercise.value"
      class="mt-4 space-y-8"
    >
      <section class="space-y-3">
        <p class="badge badge-ghost">
          English
        </p>
        <p class="text-2xl sm:text-3xl">
          {{ session.exercise.value.english }}
        </p>
        <p class="text-sm opacity-70">
          Source:
          <template
            v-for="(token, index) in tokenizeCredit(session.exercise.value.english_credit)"
            :key="'eng-' + index"
          >
            <a
              v-if="token.type === 'link'"
              :href="token.href"
              class="link link-hover"
              rel="noreferrer noopener"
              target="_blank"
            >{{ token.text }}</a>
            <span v-else>{{ token.text }}</span>
          </template>
        </p>
      </section>

      <section class="space-y-3">
        <p class="badge badge-ghost">
          German
        </p>
        <p class="text-3xl font-semibold sm:text-4xl">
          <template v-if="session.revealedAnswer.value">
            {{ sentenceParts().before }}
            <span class="rounded-box bg-warning px-1 text-warning-content">{{ session.revealedAnswer.value }}</span>
            {{ sentenceParts().after }}
          </template>
          <template v-else>{{ session.exercise.value.cloze }}</template>
        </p>
        <p class="text-sm opacity-70">
          Source:
          <template
            v-for="(token, index) in tokenizeCredit(session.exercise.value.german_credit)"
            :key="'deu-' + index"
          >
            <a
              v-if="token.type === 'link'"
              :href="token.href"
              class="link link-hover"
              rel="noreferrer noopener"
              target="_blank"
            >{{ token.text }}</a>
            <span v-else>{{ token.text }}</span>
          </template>
        </p>
      </section>

      <div class="grid gap-3 sm:grid-cols-2">
        <button
          v-for="answer in session.displayedAnswers.value"
          :key="answer"
          type="button"
          class="btn btn-lg min-h-16 text-lg"
          :class="session.revealedAnswer.value === answer ? 'btn-success' : 'btn-neutral'"
          :disabled="session.disabledAnswers.value.includes(answer) || session.revealedAnswer.value.length > 0"
          @click="session.handleAnswer(answer)"
        >
          {{ answer }}
        </button>
      </div>
    </div>
  </main>
</template>
