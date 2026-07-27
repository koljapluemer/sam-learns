<script setup lang="ts">
import { Pencil, Trash2, X } from 'lucide-vue-next'
import { useManageWords } from './useManageWords'

const {
  loading,
  words,
  editing,
  editWord,
  editMeaning,
  editExamples,
  removeEditExample,
  editNotes,
  removeEditNote,
  saving,
  openEdit,
  closeEdit,
  saveEdit,
  remove
} = useManageWords()
</script>

<template>
  <div class="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-8">
    <h1 class="text-2xl font-semibold">
      Words
    </h1>

    <div v-if="loading">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div
      v-else-if="words.length === 0"
      class="opacity-70"
    >
      No words yet.
    </div>

    <div
      v-else
      class="overflow-x-auto"
    >
      <table class="table table-sm">
        <thead>
          <tr>
            <th>Word</th>
            <th>Meaning</th>
            <th class="w-1" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="word in words"
            :key="word.id"
          >
            <td>{{ word.word }}</td>
            <td>{{ word.meaning }}</td>
            <td class="flex justify-end gap-1">
              <button
                type="button"
                class="btn btn-ghost btn-sm btn-circle"
                aria-label="Edit"
                @click="openEdit(word)"
              >
                <Pencil class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-sm btn-circle text-error"
                aria-label="Delete"
                @click="remove(word)"
              >
                <Trash2 class="w-4 h-4" />
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
          @click="closeEdit"
        >
          <X class="w-4 h-4" />
        </button>

        <h3 class="text-lg font-semibold">
          Edit word
        </h3>

        <form
          class="mt-4 flex flex-col gap-4"
          @submit.prevent="saveEdit"
        >
          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium">Word</span>
            <input
              v-model="editWord"
              type="text"
              class="input w-full"
              required
            >
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium">Meaning</span>
            <input
              v-model="editMeaning"
              type="text"
              class="input w-full"
              required
            >
          </label>

          <div class="flex flex-col gap-2">
            <span class="text-sm font-medium">Examples</span>
            <div
              v-for="(example, index) in editExamples"
              :key="index"
              class="flex items-center gap-2"
            >
              <div class="flex flex-1 flex-col gap-2">
                <input
                  v-model="example.sentence"
                  type="text"
                  placeholder="Sentence"
                  class="input input-sm w-full"
                >
                <input
                  v-model="example.translation"
                  type="text"
                  placeholder="Translation"
                  class="input input-sm w-full"
                >
              </div>
              <button
                v-if="editExamples.length > 1"
                type="button"
                class="btn btn-circle btn-ghost btn-sm"
                aria-label="Remove example"
                @click="removeEditExample(index)"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <span class="text-sm font-medium">Notes</span>
            <div
              v-for="(note, index) in editNotes"
              :key="index"
              class="flex items-center gap-2"
            >
              <input
                v-model="note.text"
                type="text"
                class="input input-sm w-full flex-1"
              >
              <button
                v-if="editNotes.length > 1"
                type="button"
                class="btn btn-circle btn-ghost btn-sm"
                aria-label="Remove note"
                @click="removeEditNote(index)"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div class="modal-action">
            <button
              type="button"
              class="btn"
              @click="closeEdit"
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
          @click="closeEdit"
        >
          close
        </button>
      </form>
    </dialog>
  </div>
</template>
