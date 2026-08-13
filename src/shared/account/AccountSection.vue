<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { db, loginHints } from '@/shared/db/db'
import type { UserLogin } from 'dexie-cloud-addon'

const currentUser = ref<UserLogin>(db.cloud.currentUser.value)

let subscription: { unsubscribe(): void } | undefined

onMounted(() => {
  subscription = db.cloud.currentUser.subscribe((user) => {
    currentUser.value = user
  })
})

onUnmounted(() => subscription?.unsubscribe())

function login() {
  void db.cloud.login(loginHints())
}

function logout() {
  void db.cloud.logout()
}
</script>

<template>
  <div class="flex items-center justify-between">
    <div>
      <span class="text-sm font-medium">Account</span>
      <p class="text-xs text-base-content/60">
        <template v-if="currentUser.isLoggedIn">
          {{ currentUser.email ?? currentUser.name }}
        </template>
        <template v-else>
          Sign in to sync your progress across devices.
        </template>
      </p>
    </div>
    <button
      v-if="currentUser.isLoggedIn"
      type="button"
      class="btn btn-sm"
      @click="logout"
    >
      Sign out
    </button>
    <button
      v-else
      type="button"
      class="btn btn-sm"
      @click="login"
    >
      Sign in
    </button>
  </div>
</template>
