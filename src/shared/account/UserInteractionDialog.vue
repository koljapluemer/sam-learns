<script setup lang="ts">
// Renders whatever db.cloud requests (email step, OTP step, alerts, logout
// confirmation) via db.cloud.userInteraction - the documented extension
// point for a framework-native login UI (see db.cloud.configure's
// customLoginGui option in @/shared/db/db.ts). Mounted once, globally, in
// App.vue, since sync can request re-auth from any route.
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { db, signupOpen } from '@/shared/db/db'
import type { DXCAlert, DXCInputField, DXCOption, DXCUserInteraction } from 'dexie-cloud-addon'

const interaction = ref<DXCUserInteraction | undefined>(db.cloud.userInteraction.value)
const values = ref<Record<string, string>>({})

let subscription: { unsubscribe(): void } | undefined

onMounted(() => {
  subscription = db.cloud.userInteraction.subscribe((next) => {
    interaction.value = next
    values.value = Object.fromEntries(Object.keys(next?.fields ?? {}).map((name) => [name, '']))
  })
})

onUnmounted(() => subscription?.unsubscribe())

const fieldEntries = computed<[string, DXCInputField][]>(() => Object.entries(interaction.value?.fields ?? {}))

// Only DXCGenericUserInteraction/DXCEmailPrompt carry `options` (social-login
// buttons) - narrow with an `in` check rather than a union-wide `.options`.
const options = computed<DXCOption[]>(() =>
  interaction.value && 'options' in interaction.value ? (interaction.value.options ?? []) : []
)

function alertMessage(alert: DXCAlert): string {
  if (alert.messageCode === 'USER_NOT_REGISTERED' && !signupOpen) {
    return 'Account creation is currently closed.'
  }
  return alert.message
}

function inputType(fieldType: string): string {
  return fieldType === 'email' ? 'email' : fieldType === 'password' ? 'password' : 'text'
}

function submit() {
  const onSubmit = interaction.value?.onSubmit as ((params: Record<string, string>) => void) | undefined
  onSubmit?.(values.value)
}

function selectOption(name: string, value: string) {
  const onSubmit = interaction.value?.onSubmit as ((params: Record<string, string>) => void) | undefined
  onSubmit?.({ [name]: value })
}

function cancel() {
  interaction.value?.onCancel()
}
</script>

<template>
  <dialog
    class="modal"
    :class="{ 'modal-open': interaction }"
    aria-modal="true"
  >
    <div
      v-if="interaction"
      class="modal-box w-11/12 max-w-sm"
    >
      <h2 class="text-lg font-semibold">
        {{ interaction.title }}
      </h2>

      <div
        v-for="(alert, index) in interaction.alerts"
        :key="index"
        class="alert mt-4"
        :class="{
          'alert-error': alert.type === 'error',
          'alert-warning': alert.type === 'warning',
          'alert-info': alert.type === 'info'
        }"
      >
        <span>{{ alertMessage(alert) }}</span>
      </div>

      <form
        class="mt-4 flex flex-col gap-4"
        @submit.prevent="submit"
      >
        <fieldset
          v-for="[name, field] in fieldEntries"
          :key="name"
          class="fieldset gap-2"
        >
          <legend
            v-if="field.label"
            class="fieldset-legend text-sm font-medium"
          >
            {{ field.label }}
          </legend>
          <input
            v-model="values[name]"
            :type="inputType(field.type)"
            :placeholder="field.placeholder"
            class="input input-bordered w-full"
          >
        </fieldset>

        <div
          v-if="options.length"
          class="flex flex-col gap-2"
        >
          <button
            v-for="option in options"
            :key="option.name + option.value"
            type="button"
            class="btn btn-outline"
            @click="selectOption(option.name, option.value)"
          >
            {{ option.displayName }}
          </button>
        </div>

        <div class="modal-action">
          <button
            v-if="interaction.cancelLabel"
            type="button"
            class="btn btn-ghost"
            @click="cancel"
          >
            {{ interaction.cancelLabel }}
          </button>
          <button
            type="submit"
            class="btn btn-primary"
          >
            {{ interaction.submitLabel }}
          </button>
        </div>
      </form>
    </div>
  </dialog>
</template>
