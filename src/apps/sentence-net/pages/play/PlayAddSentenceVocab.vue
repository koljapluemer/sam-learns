<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Check, ClipboardPaste, Copy, Pencil, X } from 'lucide-vue-next'
import {
  deleteSentence,
  getSentence,
  markVocabDone,
  setSentenceWords,
  updateSentenceNote,
  updateSentenceText
} from '../../entities/sentence/sentence'
import { deleteSentenceCard } from '../../entities/sentence-card/sentenceCard'
import { addWord, listWords, updateWord, updateWordNote } from '../../entities/word/word'
import { createWordCard } from '../../entities/word-card/wordCard'
import { useEntityRowsForm, type EntityCandidate, type EntityFormRow } from './useEntityRowsForm'
import SimilarEntitySelect from '../../dumb/SimilarEntitySelect.vue'
import { buildVocabPrompt, parseVocabPaste } from './vocabExtractionPrompt'
import type { SentenceRow, WordRow } from '../../db/appDb'
import type { TouchedEntities } from './useQueueSelection'

const props = defineProps<{ sentenceId: string }>()
const emit = defineEmits<{ done: [touched: TouchedEntities] }>()

const sentence = ref<SentenceRow | null>(null)
const editingText = ref(false)
const editingTranslation = ref(false)
const editingNote = ref(false)
const draftText = ref('')
const draftTranslation = ref('')
const draftNote = ref('')
const confirmingDelete = ref(false)
const saving = ref(false)

const wordCandidates = ref<EntityCandidate[]>([])
const { rows, removeRow, updatePrimary, selectExisting, candidatesFor, mergeParsed, nonEmptyRows } =
  useEntityRowsForm(wordCandidates)

onMounted(async () => {
  const [row, words] = await Promise.all([getSentence(props.sentenceId), listWords()])
  sentence.value = row ?? null
  wordCandidates.value = words.map((word) => ({ id: word.id, label: `${word.text} — ${word.translation}` }))

  if (row && row.wordIds.length > 0) {
    const wordById = new Map(words.map((word) => [word.id, word]))
    const attachedRows: EntityFormRow[] = row.wordIds
      .map((id) => wordById.get(id))
      .filter((word): word is WordRow => word !== undefined)
      .map((word) => ({ primary: word.text, secondary: word.translation, note: word.note, existingId: word.id }))
    if (attachedRows.length > 0) rows.value = attachedRows
  }
})

function startEditText(): void {
  draftText.value = sentence.value?.text ?? ''
  editingText.value = true
}

async function saveEditText(): Promise<void> {
  if (!sentence.value) return
  const text = draftText.value.trim()
  await updateSentenceText(props.sentenceId, text, sentence.value.translation)
  sentence.value.text = text
  editingText.value = false
}

function startEditTranslation(): void {
  draftTranslation.value = sentence.value?.translation ?? ''
  editingTranslation.value = true
}

async function saveEditTranslation(): Promise<void> {
  if (!sentence.value) return
  const translation = draftTranslation.value.trim()
  await updateSentenceText(props.sentenceId, sentence.value.text, translation)
  sentence.value.translation = translation
  editingTranslation.value = false
}

function startEditNote(): void {
  draftNote.value = sentence.value?.note ?? ''
  editingNote.value = true
}

async function saveEditNote(): Promise<void> {
  if (!sentence.value) return
  const note = draftNote.value.trim()
  await updateSentenceNote(props.sentenceId, note)
  sentence.value.note = note
  editingNote.value = false
}

async function copyPrompt(): Promise<void> {
  if (!sentence.value) return
  try {
    await navigator.clipboard.writeText(buildVocabPrompt(sentence.value.text, sentence.value.translation))
  } catch {
    // clipboard unavailable - nothing sensible to fall back to
  }
}

async function pasteAnswer(): Promise<void> {
  try {
    const clipboardText = await navigator.clipboard.readText()
    const parsed = parseVocabPaste(clipboardText)
    mergeParsed(parsed.map((row) => ({ primary: row.word, secondary: row.translation, note: row.note })))
  } catch {
    // clipboard unavailable - nothing sensible to fall back to
  }
}

async function resolveWordIds(): Promise<string[]> {
  const ids: string[] = []
  for (const row of nonEmptyRows.value) {
    if (row.existingId) {
      await updateWord(row.existingId, row.primary.trim(), row.secondary.trim())
      if (row.note.trim()) await updateWordNote(row.existingId, row.note.trim())
      ids.push(row.existingId)
      continue
    }
    const id = await addWord(row.primary.trim(), row.secondary.trim(), row.note.trim())
    await createWordCard(id)
    ids.push(id)
  }
  return ids
}

async function finish(markDone: boolean): Promise<void> {
  saving.value = true
  const wordIds = await resolveWordIds()
  await setSentenceWords(props.sentenceId, wordIds)
  if (markDone) await markVocabDone(props.sentenceId)
  saving.value = false

  emit('done', { sentenceIds: [props.sentenceId], wordIds })
}

async function confirmDelete(): Promise<void> {
  await deleteSentence(props.sentenceId)
  await deleteSentenceCard(props.sentenceId)
  confirmingDelete.value = false
  emit('done', { sentenceIds: [props.sentenceId], wordIds: [] })
}
</script>

<template>
  <div
    v-if="sentence"
    class="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-8"
  >
    <h2 class="text-xl font-semibold">
      Sentence vocab
    </h2>

    <div class="flex items-center gap-2">
      <template v-if="editingText">
        <input
          v-model="draftText"
          type="text"
          class="input input-sm flex-1 font-bold"
          @keyup.enter="saveEditText"
        >
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-circle"
          aria-label="Save sentence"
          @click="saveEditText"
        >
          <Check class="h-4 w-4" />
        </button>
      </template>
      <template v-else>
        <p class="flex-1 font-bold">
          {{ sentence.text }}
        </p>
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-circle"
          aria-label="Edit sentence"
          @click="startEditText"
        >
          <Pencil class="h-4 w-4" />
        </button>
      </template>
    </div>

    <div class="flex items-center gap-2">
      <template v-if="editingTranslation">
        <input
          v-model="draftTranslation"
          type="text"
          class="input input-sm flex-1 font-bold"
          @keyup.enter="saveEditTranslation"
        >
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-circle"
          aria-label="Save translation"
          @click="saveEditTranslation"
        >
          <Check class="h-4 w-4" />
        </button>
      </template>
      <template v-else>
        <p class="flex-1 font-bold opacity-70">
          {{ sentence.translation }}
        </p>
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-circle"
          aria-label="Edit translation"
          @click="startEditTranslation"
        >
          <Pencil class="h-4 w-4" />
        </button>
      </template>
    </div>

    <div class="flex items-center gap-2">
      <template v-if="editingNote">
        <input
          v-model="draftNote"
          type="text"
          placeholder="Note"
          class="input input-sm flex-1"
          @keyup.enter="saveEditNote"
        >
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-circle"
          aria-label="Save note"
          @click="saveEditNote"
        >
          <Check class="h-4 w-4" />
        </button>
      </template>
      <template v-else>
        <p class="flex-1 text-sm italic opacity-60">
          {{ sentence.note || 'No note' }}
        </p>
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-circle"
          aria-label="Edit note"
          @click="startEditNote"
        >
          <Pencil class="h-4 w-4" />
        </button>
      </template>
    </div>

    <div class="divider" />

    <div class="flex gap-2">
      <button
        type="button"
        class="btn btn-sm"
        @click="copyPrompt"
      >
        <Copy class="h-4 w-4" />
        Copy prompt
      </button>
      <button
        type="button"
        class="btn btn-sm"
        @click="pasteAnswer"
      >
        <ClipboardPaste class="h-4 w-4" />
        Paste answer
      </button>
    </div>

    <div class="flex flex-col gap-2">
      <div
        v-for="(row, index) in rows"
        :key="index"
        class="border-base-300 bg-base-200/40 flex items-center gap-2 rounded-box border p-2"
      >
        <div class="flex flex-1 flex-col gap-2">
          <SimilarEntitySelect
            :model-value="row.primary"
            :candidates="candidatesFor(row)"
            field-label="Word"
            @update:model-value="updatePrimary(index, $event)"
            @select-existing="(id, label) => selectExisting(index, id, label)"
          />
          <label class="input input-sm w-full">
            <span class="label w-20 text-xs">Translation</span>
            <input
              v-model="row.secondary"
              type="text"
              class="grow font-bold"
            >
          </label>
          <input
            v-model="row.note"
            type="text"
            placeholder="Note (optional)"
            class="input input-xs w-full"
          >
        </div>
        <button
          v-if="rows.length > 1"
          type="button"
          class="btn btn-circle btn-ghost btn-sm"
          aria-label="Remove row"
          @click="removeRow(index)"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    </div>

    <div class="mt-2 flex flex-col gap-2">
      <button
        type="button"
        class="btn btn-primary"
        :disabled="saving"
        @click="finish(true)"
      >
        Done
      </button>
      <button
        type="button"
        class="btn"
        :disabled="saving"
        @click="finish(false)"
      >
        Finish later
      </button>
      <button
        type="button"
        class="btn btn-ghost text-error"
        @click="confirmingDelete = true"
      >
        Delete sentence
      </button>
    </div>

    <dialog
      class="modal"
      :class="{ 'modal-open': confirmingDelete }"
    >
      <div class="modal-box">
        <h3 class="text-lg font-semibold">
          Delete this sentence?
        </h3>
        <p class="py-2 opacity-70">
          Its vocab links will be discarded without saving.
        </p>
        <div class="modal-action">
          <button
            type="button"
            class="btn"
            @click="confirmingDelete = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-error"
            @click="confirmDelete"
          >
            Delete
          </button>
        </div>
      </div>
      <form
        method="dialog"
        class="modal-backdrop"
      >
        <button
          type="button"
          @click="confirmingDelete = false"
        >
          close
        </button>
      </form>
    </dialog>
  </div>
</template>
