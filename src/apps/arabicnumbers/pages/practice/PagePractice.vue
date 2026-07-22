<script setup lang="ts">
// Ported from linguanodon's arabicnumbers app/practiceApp.js - the template
// is already Vue-flavored markup, so this is close to a direct copy.
import { usePracticeSession } from '../../app/usePracticeSession'
import { calculateColor, convertNumberToArabicScript } from '../../app/helpers'

const session = usePracticeSession()

function sortedNumberBank() {
  return session.getNumberBank().slice().sort((a, b) => a.val - b.val)
}
</script>

<template>
  <main class="p-2 flex flex-col items-center w-full max-w-xl mx-auto gap-8">
    <div
      v-if="session.loadError.value"
      class="alert alert-error w-full"
    >
      <span>{{ session.loadError.value }}</span>
    </div>

    <div
      v-else-if="session.loading.value"
      class="flex min-h-64 items-center justify-center w-full"
    >
      <span class="loading loading-spinner loading-lg" />
    </div>

    <template v-else>
      <div
        v-if="session.exercise.value"
        class="card shadow-md w-full"
        style="min-height: 390px"
      >
        <div class="card-body flex flex-col items-center">
          <p
            v-if="session.getExercisesDoneThisSession() < 3"
            class="border-b p-2"
          >
            Select the matching answers out of the four options below. If you are
            not sure, just guess!
          </p>
          <div
            id="prompt"
            class="text-3xl p-2"
          >
            {{ session.prompt.value }}
          </div>
          <div class="card-actions flex-col justify-end mt-6 pt-2 w-full">
            <button
              v-for="(answer, index) in session.possibleAnswers.value"
              :key="session.exercise.value.key + '-' + index"
              style="line-height: 1em"
              class="btn text-2xl w-full lowercase p-2"
              :class="{
                'btn-success': session.guessMade.value && index == session.indexOfAnswerClicked.value && session.givenAnswer.value === session.correctAnswer.value,
                'btn-error': session.guessMade.value && index == session.indexOfAnswerClicked.value && session.givenAnswer.value !== session.correctAnswer.value,
                'btn-info': session.guessMade.value && index != session.indexOfAnswerClicked.value && answer === session.correctAnswer.value && session.givenAnswer.value !== session.correctAnswer.value,
                'text-3xl': session.fieldUsedAsAnswer.value === 'ar',
                'shine-button wiggle-button': answer === session.correctAnswer.value && session.streak.value < 3 && !session.guessMade.value && !session.userSawExerciseBefore()
              }"
              :disabled="session.guessMade.value"
              @click="session.handleAnswer(answer)"
            >
              {{ answer }}
            </button>

            <button
              v-if="session.guessMade.value"
              class="btn btn-primary mt-4 self-end"
              @click="session.getNextExercise"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div class="card shadow-md w-full">
        <div class="card-body flex flex-col items-center">
          <h2 class="text-xl font-bold m-2">
            Missions
          </h2>
          <div
            v-for="(mission, name) in session.missions.value"
            :key="name"
            class="m-2 flex flex-col max-w-md w-full"
          >
            {{ name }}
            <progress
              class="w-full progress"
              :value="mission.progress"
              :max="mission.goals[mission.currentGoal]"
            />
            <div>
              {{ convertNumberToArabicScript(mission.progress) }} /
              {{ convertNumberToArabicScript(mission.goals[mission.currentGoal]) }}
            </div>
          </div>

          <h2 class="text-xl font-bold m-2">
            Statistics
          </h2>

          <div
            class="grid gap-2"
            style="grid-template-columns: repeat(10, 1rem)"
          >
            <div
              v-for="(number, index) in sortedNumberBank()"
              :key="index"
              class="w-4 h-4 flex items-center justify-center shadow-xs relative border border-gray-400 rounded"
            >
              <div
                class="absolute inset-0 bottom-0 rounded"
                :style="{
                  height: number.level * 10 + '%',
                  backgroundColor: calculateColor(number.level),
                  transition: 'height 0.5s ease'
                }"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </main>
</template>
