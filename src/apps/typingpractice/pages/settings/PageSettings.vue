<script setup lang="ts">
import { useLocalSetting } from '@/shared/settings/useLocalSetting'
import GeneralSettingsSection from '@/shared/settings/GeneralSettingsSection.vue'
import type { KeystrokeMethod } from '../../app/keystrokes'

const method = useLocalSetting<KeystrokeMethod>('typingpractice-vn-input-method', 'off')

const methods: { value: KeystrokeMethod; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'telex', label: 'TELEX' },
  { value: 'vni', label: 'VNI' }
]
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-6 p-4">
    <h1 class="text-2xl font-bold">
      Settings
    </h1>

    <div class="flex flex-col items-center gap-2">
      <span class="text-sm opacity-70">Keystroke input method</span>
      <div class="join">
        <button
          v-for="option in methods"
          :key="option.value"
          type="button"
          class="btn join-item"
          :class="{ 'btn-active': method === option.value }"
          @click="method = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </div>
  </div>
  <GeneralSettingsSection />
</template>
