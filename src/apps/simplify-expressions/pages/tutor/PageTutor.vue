<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CheckCircle2, CircleAlert, Lightbulb, RefreshCw } from 'lucide-vue-next'
import { useAppI18n } from '@/apps/simplify-expressions/app/i18n'
import MathInput from '@/apps/simplify-expressions/dumb/MathInput.vue'
import RenderedMath from '@/apps/simplify-expressions/dumb/RenderedMath.vue'
import { gradeAnswer } from '@/apps/simplify-expressions/entities/expression-exercise/exerciseGrader'
import {
  getNextExercise,
  recordExerciseAttempt
} from '@/apps/simplify-expressions/entities/expression-exercise/exerciseScheduler'
import { normalizeExpression } from '@/apps/simplify-expressions/entities/expression-exercise/mathEngine'
import { logExerciseAttempt } from './logExerciseAttempt'
import type {
  ExpressionExercise,
  GradeResult
} from '@/apps/simplify-expressions/entities/expression-exercise/exerciseTypes'

const { t } = useAppI18n()

const exercise = ref<ExpressionExercise | null>(null)
const answer = ref('')
const isLoading = ref(true)
const resolution = ref<{ kind: 'revealed' } | { kind: 'graded'; result: GradeResult } | null>(null)
const shownAt = ref(Date.now())

type TutorState =
  | { mode: 'loading' }
  | { mode: 'editing'; hasInput: boolean }
  | { mode: 'resolved'; resolution: NonNullable<typeof resolution.value> }

const tutorState = computed<TutorState>(() => {
  if (isLoading.value || !exercise.value) {
    return { mode: 'loading' }
  }

  if (resolution.value) {
    return { mode: 'resolved', resolution: resolution.value }
  }

  if (answer.value.trim().length > 0) {
    return { mode: 'editing', hasInput: true }
  }

  return { mode: 'editing', hasInput: false }
})

const feedbackKey = computed(() => {
  if (tutorState.value.mode === 'loading') {
    return 'tutor.feedback.loading'
  }

  if (tutorState.value.mode === 'resolved') {
    if (tutorState.value.resolution.kind === 'revealed') {
      return 'tutor.feedback.revealed'
    }

    return `tutor.feedback.${tutorState.value.resolution.result.reason}`
  }

  return 'tutor.feedback.idle'
})

const feedbackClass = computed(() => {
  if (tutorState.value.mode === 'resolved') {
    if (tutorState.value.resolution.kind === 'revealed') {
      return 'alert-info'
    }

    return tutorState.value.resolution.result.isCorrect ? 'alert-success' : 'alert-warning'
  }

  return 'alert-info'
})

const feedbackIcon = computed(() => {
  if (tutorState.value.mode === 'resolved') {
    if (tutorState.value.resolution.kind === 'revealed') {
      return Lightbulb
    }

    return tutorState.value.resolution.result.isCorrect ? CheckCircle2 : CircleAlert
  }

  if (tutorState.value.mode === 'loading') {
    return RefreshCw
  }

  return Lightbulb
})

const isResolved = computed(() => tutorState.value.mode === 'resolved')
const isSolutionVisible = computed(() => isResolved.value && exercise.value !== null)
const actionConfig = computed(() => {
  if (tutorState.value.mode === 'loading') {
    return {
      label: t('tutor.loadingAction'),
      icon: RefreshCw,
      handler: loadExercise
    }
  }

  if (tutorState.value.mode === 'resolved') {
    return {
      label: t('tutor.next'),
      icon: RefreshCw,
      handler: loadExercise
    }
  }

  if (tutorState.value.mode === 'editing' && !tutorState.value.hasInput) {
    return {
      label: t('tutor.giveUp'),
      icon: Lightbulb,
      handler: revealSolution
    }
  }

  return {
    label: t('tutor.check'),
    icon: CheckCircle2,
    handler: checkAnswer
  }
})

onMounted(async () => {
  await loadExercise()
})

async function loadExercise() {
  isLoading.value = true
  exercise.value = await getNextExercise()
  answer.value = ''
  resolution.value = null
  shownAt.value = Date.now()
  isLoading.value = false
}

async function checkAnswer() {
  if (!exercise.value) return

  if (import.meta.env.DEV) {
    console.log('grading expression answer', {
      rawAnswer: answer.value,
      normalizedAnswer: normalizeExpression(answer.value),
      source: exercise.value.source,
      normalizedSource: normalizeExpression(exercise.value.source),
      target: exercise.value.target,
      normalizedTarget: normalizeExpression(exercise.value.target)
    })
  }

  const result = gradeAnswer(exercise.value, answer.value)
  resolution.value = {
    kind: 'graded',
    result
  }

  const attempt = await recordExerciseAttempt({
    exercise: exercise.value,
    answer: answer.value,
    resultReason: result.reason,
    isCorrect: result.isCorrect,
    latencyMs: Date.now() - shownAt.value
  })

  void logExerciseAttempt(attempt).catch((error) => {
    console.error('failed to log exercise attempt', error)
  })
}

async function revealSolution() {
  if (!exercise.value) return

  resolution.value = { kind: 'revealed' }

  const attempt = await recordExerciseAttempt({
    exercise: exercise.value,
    answer: '',
    resultReason: 'revealed',
    isCorrect: false,
    latencyMs: Date.now() - shownAt.value
  })

  void logExerciseAttempt(attempt).catch((error) => {
    console.error('failed to log exercise attempt', error)
  })
}
</script>

<template>
  <section class="flex w-full max-w-xl flex-col gap-5">
    <div
      class="alert"
      :class="feedbackClass"
    >
      <component
        :is="feedbackIcon"
        :size="22"
        :class="{ 'animate-spin': tutorState.mode === 'loading' }"
        aria-hidden="true"
      />
      <div class="flex min-w-0 flex-1 flex-col gap-3">
        <span>{{ t(feedbackKey) }}</span>
        <RenderedMath
          v-if="isSolutionVisible && exercise"
          :expression="exercise.target"
        />
      </div>
    </div>

    <div
      v-if="exercise"
      class="flex flex-col gap-3"
    >
      <RenderedMath :expression="exercise.source" />
    </div>

    <div class="flex flex-col gap-3">
      <MathInput
        v-model="answer"
        :autofocus="true"
        :disabled="isResolved || tutorState.mode === 'loading'"
        :label="t('tutor.answerLabel')"
        :placeholder="t('tutor.answerPlaceholder')"
        @submit="actionConfig.handler"
      />
      <button
        class="btn btn-primary"
        type="button"
        :disabled="isLoading"
        @click="actionConfig.handler"
      >
        <component
          :is="actionConfig.icon"
          :size="20"
          :class="{ 'animate-spin': tutorState.mode === 'loading' }"
          aria-hidden="true"
        />
        {{ actionConfig.label }}
      </button>
    </div>
  </section>
</template>
