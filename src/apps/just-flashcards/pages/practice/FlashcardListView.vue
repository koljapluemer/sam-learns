<script setup lang="ts">
import { Pencil, PlusCircle, Trash2, X } from 'lucide-vue-next'
import { useManageFlashcards } from './useManageFlashcards'

const { loading, flashcards, editing, front, back, saving, openAdd, openEdit, close, save, remove } = useManageFlashcards()

defineExpose({ openAdd })
</script>

<template>
  <div class="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-8">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">
        Flashcards
      </h1>
      <button
        type="button"
        class="btn btn-primary btn-sm"
        @click="openAdd"
      >
        <PlusCircle class="h-4 w-4" />
        Add
      </button>
    </div>

    <div v-if="loading">
      <span class="loading loading-spinner loading-lg" />
    </div>
    <p
      v-else-if="flashcards.length === 0"
      class="opacity-70"
    >
      No flashcards yet.
    </p>

    <div
      v-else
      class="overflow-x-auto"
    >
      <table class="table table-sm">
        <thead><tr><th>Front</th><th>Back</th><th class="w-1" /></tr></thead>
        <tbody>
          <tr
            v-for="flashcard in flashcards"
            :key="flashcard.id"
          >
            <td class="max-w-48 truncate">
              {{ flashcard.front }}
            </td>
            <td class="max-w-48 truncate opacity-70">
              {{ flashcard.back }}
            </td>
            <td class="flex justify-end gap-1">
              <button
                type="button"
                class="btn btn-ghost btn-sm btn-circle"
                aria-label="Edit"
                @click="openEdit(flashcard)"
              >
                <Pencil class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-sm btn-circle text-error"
                aria-label="Delete"
                @click="remove(flashcard)"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <dialog
      class="modal"
      :class="{ 'modal-open': editing }"
    >
      <div class="modal-box">
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-circle absolute right-2 top-2"
          aria-label="Close"
          @click="close"
        >
          <X class="h-4 w-4" />
        </button>
        <h2 class="text-lg font-semibold">
          {{ editing === 'new' ? 'Add flashcard' : 'Edit flashcard' }}
        </h2>
        <form
          class="mt-4 flex flex-col gap-4"
          @submit.prevent="save"
        >
          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium">Front</span>
            <textarea
              v-model="front"
              class="textarea w-full"
              rows="4"
              required
            />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium">Back</span>
            <textarea
              v-model="back"
              class="textarea w-full"
              rows="4"
              required
            />
          </label>
          <p class="text-xs opacity-60">
            Markdown is supported.
          </p>
          <div class="modal-action">
            <button
              type="button"
              class="btn"
              @click="close"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="saving"
            >
              Save
            </button>
          </div>
        </form>
      </div>
      <form
        method="dialog"
        class="modal-backdrop"
      >
        <button
          type="button"
          @click="close"
        >
          close
        </button>
      </form>
    </dialog>
  </div>
</template>
