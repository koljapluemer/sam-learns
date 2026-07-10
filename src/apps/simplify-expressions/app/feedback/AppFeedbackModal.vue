<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppI18n } from '../i18n'
import { submitFeedback } from './submitFeedback'
import type { AppLocale } from '@/apps/simplify-expressions/app/i18n'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const { locale, t } = useAppI18n()

const helpfulForLearning = ref('')
const improveUsefulness = ref('')
const anythingElse = ref('')
const website = ref('')
const status = ref<'idle' | 'saving' | 'error'>('idle')

const hasContent = computed(() => {
  return [helpfulForLearning.value, improveUsefulness.value, anythingElse.value].some(
    (value) => value.trim().length > 0
  )
})

const canSubmit = computed(() => status.value !== 'saving' && hasContent.value)

function closeModal() {
  if (status.value === 'saving') return
  emit('close')
}

function resetForm() {
  helpfulForLearning.value = ''
  improveUsefulness.value = ''
  anythingElse.value = ''
  website.value = ''
  status.value = 'idle'
}

async function handleSubmit() {
  if (!canSubmit.value) {
    return
  }

  status.value = 'saving'

  try {
    await submitFeedback({
      helpfulForLearning: helpfulForLearning.value,
      improveUsefulness: improveUsefulness.value,
      anythingElse: anythingElse.value,
      website: website.value,
      locale: locale.value as AppLocale
    })
    resetForm()
    emit('close')
  } catch {
    status.value = 'error'
  }
}
</script>

<template>
  <dialog
    class="modal"
    :class="{ 'modal-open': isOpen }"
    aria-modal="true"
  >
    <div class="modal-box w-11/12 max-w-lg">
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-1">
          <h2 class="text-lg font-semibold">
            {{ t('feedbackForm.title') }}
          </h2>
          <p class="text-sm text-base-content/70">
            {{ t('feedbackForm.intro') }}
          </p>
        </div>
        <button
          class="btn btn-ghost btn-sm btn-circle"
          type="button"
          :aria-label="t('feedbackForm.close')"
          @click="closeModal"
        >
          <span aria-hidden="true">{{ t('feedbackForm.closeSymbol') }}</span>
        </button>
      </div>

      <form
        class="mt-6"
        @submit.prevent="handleSubmit"
      >
        <div class="grid gap-5">
          <fieldset class="fieldset gap-2">
            <legend class="fieldset-legend text-sm font-medium">
              {{ t('feedbackForm.helpfulForLearningLabel') }}
            </legend>
            <textarea
              v-model="helpfulForLearning"
              class="textarea textarea-bordered min-h-28 w-full"
            />
          </fieldset>

          <fieldset class="fieldset gap-2">
            <legend class="fieldset-legend text-sm font-medium">
              {{ t('feedbackForm.improveUsefulnessLabel') }}
            </legend>
            <textarea
              v-model="improveUsefulness"
              class="textarea textarea-bordered min-h-28 w-full"
            />
          </fieldset>

          <fieldset class="fieldset gap-2">
            <legend class="fieldset-legend text-sm font-medium">
              {{ t('feedbackForm.anythingElseLabel') }}
            </legend>
            <textarea
              v-model="anythingElse"
              class="textarea textarea-bordered min-h-28 w-full"
            />
          </fieldset>
        </div>

        <label class="hidden">
          <span>{{ t('feedbackForm.websiteLabel') }}</span>
          <input
            v-model="website"
            type="text"
            tabindex="-1"
            autocomplete="off"
          >
        </label>

        <div
          v-if="status === 'error'"
          class="alert alert-error mt-5"
        >
          <span>{{ t('feedbackForm.error') }}</span>
        </div>

        <div class="modal-action mt-6">
          <button
            class="btn btn-ghost"
            type="button"
            :disabled="status === 'saving'"
            @click="closeModal"
          >
            {{ t('feedbackForm.cancel') }}
          </button>
          <button
            class="btn btn-primary"
            type="submit"
            :disabled="!canSubmit"
          >
            {{ status === 'saving' ? t('feedbackForm.sending') : t('feedbackForm.submit') }}
          </button>
        </div>
      </form>
    </div>
    <form
      class="modal-backdrop"
      method="dialog"
    >
      <button
        type="button"
        @click="closeModal"
      >
        {{ t('feedbackForm.close') }}
      </button>
    </form>
  </dialog>
</template>
