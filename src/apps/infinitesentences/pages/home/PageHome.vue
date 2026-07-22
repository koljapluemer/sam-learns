<script setup lang="ts">
// Port of linguanodon's infinitesentences app/landingApp.js + templates/infinite-sentences/landing.html.
import { BookOpen, Brain, MessageSquareText } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="max-w-2xl mx-auto w-full flex flex-col gap-12 py-8 px-4">
    <section class="flex flex-col items-center text-center gap-6">
      <div class="flex flex-col gap-2">
        <h1 class="text-4xl font-bold">
          Infinite Sentences
        </h1>
        <p class="text-lg opacity-70">
          Learn a language word by word and sentence by sentence.
        </p>
      </div>

      <RouterLink
        :to="{ name: 'infinitesentences-select-native-language' }"
        class="btn btn-primary btn-lg"
      >
        Start learning
      </RouterLink>
      <small>Free, no sign-up.</small>
    </section>

    <section class="flex flex-col gap-4">
      <h2 class="text-xl font-semibold text-center">
        How it works
      </h2>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div class="flex flex-col gap-2">
          <BookOpen class="w-6 h-6 text-primary" />
          <p class="font-semibold">
            Vocab first
          </p>
          <p class="opacity-70">
            You will be introduced and familiarized with vocabulary needed to understand a specific natural language
            sentence.
          </p>
        </div>

        <div class="flex flex-col gap-2">
          <MessageSquareText class="w-6 h-6 text-primary" />
          <p class="font-semibold">
            Full sentence
          </p>
          <p class="opacity-70">
            Having all the words freshly in your mind, you will be prompted to make sense of a sentence in your
            target language containing the practiced words.
          </p>
        </div>

        <div class="flex flex-col gap-2">
          <Brain class="w-6 h-6 text-primary" />
          <p class="font-semibold">
            Gain Intuition
          </p>
          <p class="opacity-70">
            Over time, you will learn more and more new words, solidify the known ones and get a feeling for how
            they are authentically used.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
