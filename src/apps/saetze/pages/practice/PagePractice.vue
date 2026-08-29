<script setup lang="ts">
// Ported from linguanodon's saetze app/practiceApp.js. The lesson to drill is
// picked once in the standard setup modal and remembered locally; the session
// reloads whenever it changes.
import { onMounted, ref } from 'vue'
import { usePracticeSession } from '../../app/usePracticeSession'
import { tokenizeCredit } from '../../app/credit'
import { useActiveTime } from '@/shared/activity/useActiveTime'
import { useLocalSetting } from '@/shared/settings/useLocalSetting'
import PracticeSetupModal from '@/shared/shell/PracticeSetupModal.vue'
import type { Lesson } from '../../app/types'

const lessonKey = useLocalSetting('saetze.lesson-key', '')
const session = usePracticeSession(lessonKey)
useActiveTime('saetze')

const lessons = ref<Lesson[]>([])
const lessonsError = ref('')
const setupOpen = ref(false)

onMounted(async () => {
  try {
    const response = await fetch('/data/saetze/lessons.json')
    if (!response.ok) throw new Error(`Failed to load lessons (${response.status})`)
    lessons.value = (await response.json()) as Lesson[]
  } catch (error) {
    lessonsError.value = error instanceof Error ? error.message : 'Could not load lessons.'
  }
  if (!lessonKey.value) setupOpen.value = true
})

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
          <template v-else>
            {{ session.exercise.value.cloze }}
          </template>
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

    <PracticeSetupModal
      :open="setupOpen"
      :ready="!!lessonKey"
      title="Pick a lesson"
      @close="setupOpen = false"
    >
      <div
        v-if="lessonsError"
        class="alert alert-error"
      >
        <span>{{ lessonsError }}</span>
      </div>
      <div
        v-else
        class="flex flex-col gap-2"
      >
        <button
          v-for="lesson in lessons"
          :key="lesson.key"
          type="button"
          class="btn justify-start"
          :class="lessonKey === lesson.key ? 'btn-primary' : 'btn-outline'"
          @click="lessonKey = lesson.key"
        >
          {{ lesson.name }}
        </button>
        <p
          v-if="lessons.length === 0"
          class="text-sm opacity-70"
        >
          No lessons imported yet.
        </p>
      </div>
    </PracticeSetupModal>
  </main>
</template>
