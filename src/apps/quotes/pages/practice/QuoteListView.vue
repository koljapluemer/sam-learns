<script setup lang="ts">
import { Pencil, PlusCircle, Trash2, X } from 'lucide-vue-next'
import { useManageQuotes } from './useManageQuotes'

const {
  loading,
  quotes,
  editing,
  editContent,
  editAttribution,
  saving,
  openAdd,
  openEdit,
  closeEdit,
  saveEdit,
  remove
} = useManageQuotes()

defineExpose({ openAdd })
</script>

<template>
  <div class="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-8">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">
        Quotes
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

    <div
      v-else-if="quotes.length === 0"
      class="opacity-70"
    >
      No quotes yet.
    </div>

    <div
      v-else
      class="overflow-x-auto"
    >
      <table class="table table-sm">
        <thead>
          <tr>
            <th>Quote</th>
            <th>Attribution</th>
            <th class="w-1" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="quote in quotes"
            :key="quote.id"
          >
            <td class="max-w-xs truncate">
              {{ quote.content }}
            </td>
            <td class="max-w-32 truncate opacity-70">
              {{ quote.attribution }}
            </td>
            <td class="flex justify-end gap-1">
              <button
                type="button"
                class="btn btn-ghost btn-sm btn-circle"
                aria-label="Edit"
                @click="openEdit(quote)"
              >
                <Pencil class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-sm btn-circle text-error"
                aria-label="Delete"
                @click="remove(quote)"
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
          {{ editing === 'new' ? 'Add quote' : 'Edit quote' }}
        </h3>

        <form
          class="mt-4 flex flex-col gap-4"
          @submit.prevent="saveEdit"
        >
          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium">Quote</span>
            <textarea
              v-model="editContent"
              class="textarea w-full"
              rows="3"
              required
            />
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium">Attribution</span>
            <input
              v-model="editAttribution"
              type="text"
              class="input w-full"
            >
          </label>

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
