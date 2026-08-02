<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Check, ClipboardPaste, Copy, Pencil, X } from 'lucide-vue-next'
import {
  deleteWord,
  getWord,
  listWordLanguages,
  setExamplesOptOut,
  updateWord,
  updateWordLanguage,
  updateWordNote,
  countExampleSentences
} from '../../entities/word/word'
import {
  addSentence,
  addWordToSentence,
  findSentenceByText,
  listSentenceLanguages,
  listSentences,
  removeWordFromSentence,
  updateSentenceNote,
  updateSentenceText
} from '../../entities/sentence/sentence'
import { createSentenceCard } from '../../entities/sentence-card/sentenceCard'
import { deleteWordCard } from '../../entities/word-card/wordCard'
import { collectLanguages } from '../../dumb/collectLanguages'
import { useEntityRowsForm, type EntityCandidate, type EntityFormRow } from './useEntityRowsForm'
import SimilarEntitySelect from '../../dumb/SimilarEntitySelect.vue'
import { buildExampleSentencesPrompt, parseExampleSentencesPaste } from './exampleSentencePrompt'
import type { WordRow } from '../../db/appDb'
import type { TouchedEntities } from './useQueueSelection'

const props = defineProps<{ wordId: string }>()
const emit = defineEmits<{ done: [touched: TouchedEntities] }>()

const word = ref<WordRow | null>(null)
const exampleCount = ref(0)
const editingText = ref(false)
const editingTranslation = ref(false)
const editingNote = ref(false)
const editingLanguage = ref(false)
const draftText = ref('')
const draftTranslation = ref('')
const draftNote = ref('')
const draftLanguage = ref('')
const saving = ref(false)
const confirmingDelete = ref(false)

const sentenceCandidates = ref<EntityCandidate[]>([])
const languageSuggestions = ref<string[]>([])
const { rows, removeRow, updatePrimary, selectExisting, checkBlurMatch, candidatesFor, mergeParsed, nonEmptyRows } =
  useEntityRowsForm(sentenceCandidates)

// Sentences already attached when this screen opened, so removing one of the
// pre-populated rows on save can detach it (see resolveSentenceIds).
let initiallyAttachedIds: string[] = []

onMounted(async () => {
  const [row, count, sentences, sentenceLanguages, wordLanguages] = await Promise.all([
    getWord(props.wordId),
    countExampleSentences(props.wordId),
    listSentences(),
    listSentenceLanguages(),
    listWordLanguages()
  ])
  word.value = row ?? null
  exampleCount.value = count
  sentenceCandidates.value = sentences.map((sentence) => ({
    id: sentence.id,
    text: sentence.text,
    translation: sentence.translation,
    note: sentence.note
  }))
  languageSuggestions.value = collectLanguages(sentenceLanguages, wordLanguages)

  const attachedSentences = sentences.filter((sentence) => sentence.wordIds.includes(props.wordId))
  if (attachedSentences.length > 0) {
    initiallyAttachedIds = attachedSentences.map((sentence) => sentence.id)
    rows.value = attachedSentences.map(
      (sentence): EntityFormRow => ({
        primary: sentence.text,
        secondary: sentence.translation,
        note: sentence.note,
        existingId: sentence.id
      })
    )
  }
})

function startEditText(): void {
  draftText.value = word.value?.text ?? ''
  editingText.value = true
}

async function saveEditText(): Promise<void> {
  if (!word.value) return
  const text = draftText.value.trim()
  await updateWord(props.wordId, text, word.value.translation)
  word.value.text = text
  editingText.value = false
}

function startEditTranslation(): void {
  draftTranslation.value = word.value?.translation ?? ''
  editingTranslation.value = true
}

async function saveEditTranslation(): Promise<void> {
  if (!word.value) return
  const translation = draftTranslation.value.trim()
  await updateWord(props.wordId, word.value.text, translation)
  word.value.translation = translation
  editingTranslation.value = false
}

function startEditNote(): void {
  draftNote.value = word.value?.note ?? ''
  editingNote.value = true
}

async function saveEditNote(): Promise<void> {
  if (!word.value) return
  const note = draftNote.value.trim()
  await updateWordNote(props.wordId, note)
  word.value.note = note
  editingNote.value = false
}

function startEditLanguage(): void {
  draftLanguage.value = word.value?.language ?? ''
  editingLanguage.value = true
}

async function saveEditLanguage(): Promise<void> {
  if (!word.value) return
  const language = draftLanguage.value.trim()
  await updateWordLanguage(props.wordId, language)
  word.value.language = language
  editingLanguage.value = false
}

async function copyPrompt(): Promise<void> {
  if (!word.value) return
  try {
    await navigator.clipboard.writeText(
      buildExampleSentencesPrompt(word.value.text, word.value.translation, word.value.language)
    )
  } catch {
    // clipboard unavailable - nothing sensible to fall back to
  }
}

async function pasteAnswer(): Promise<void> {
  try {
    const clipboardText = await navigator.clipboard.readText()
    const parsed = parseExampleSentencesPaste(clipboardText)
    mergeParsed(parsed.map((row) => ({ primary: row.sentence, secondary: row.translation, note: row.note })))
  } catch {
    // clipboard unavailable - nothing sensible to fall back to
  }
}

async function resolveSentenceIds(): Promise<string[]> {
  const ids: string[] = []
  for (const row of nonEmptyRows.value) {
    const text = row.primary.trim()
    const translation = row.secondary.trim()
    const note = row.note.trim()

    // Sentences are unique by text: a row not already linked in the UI
    // (e.g. a pasted row that never got checked) can still turn out to
    // match an existing sentence at save time - update it (latest write
    // wins) rather than creating a duplicate.
    const existingId = row.existingId ?? (await findSentenceByText(text))?.id ?? null
    if (existingId) {
      await updateSentenceText(existingId, text, translation)
      await updateSentenceNote(existingId, note)
      await addWordToSentence(existingId, props.wordId)
      ids.push(existingId)
      continue
    }
    const id = await addSentence(text, translation, note, word.value?.language ?? '')
    await createSentenceCard(id)
    await addWordToSentence(id, props.wordId)
    ids.push(id)
  }

  const removedIds = initiallyAttachedIds.filter((id) => !ids.includes(id))
  await Promise.all(removedIds.map((id) => removeWordFromSentence(id, props.wordId)))

  return ids
}

async function finish(optOut: boolean): Promise<void> {
  saving.value = true
  const sentenceIds = await resolveSentenceIds()
  if (optOut) await setExamplesOptOut(props.wordId)
  saving.value = false

  emit('done', { wordIds: [props.wordId], sentenceIds })
}

async function confirmDelete(): Promise<void> {
  await deleteWord(props.wordId)
  await deleteWordCard(props.wordId)
  confirmingDelete.value = false
  emit('done', { wordIds: [props.wordId], sentenceIds: [] })
}
</script>

<template>
  <div
    v-if="word"
    class="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-8"
  >
    <h2 class="text-xl font-semibold">
      Add examples
    </h2>
    <p class="text-sm opacity-70">
      {{ exampleCount }} example{{ exampleCount === 1 ? '' : 's' }} so far
    </p>

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
          aria-label="Save word"
          @click="saveEditText"
        >
          <Check class="h-4 w-4" />
        </button>
      </template>
      <template v-else>
        <p class="flex-1 text-lg font-bold">
          {{ word.text }}
        </p>
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-circle"
          aria-label="Edit word"
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
          {{ word.translation }}
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
          {{ word.note || 'No note' }}
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

    <div class="flex items-center gap-2">
      <template v-if="editingLanguage">
        <input
          v-model="draftLanguage"
          type="text"
          list="add-examples-language-options"
          placeholder="Language"
          class="input input-sm flex-1"
          @keyup.enter="saveEditLanguage"
        >
        <datalist id="add-examples-language-options">
          <option
            v-for="lang in languageSuggestions"
            :key="lang"
            :value="lang"
          />
        </datalist>
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-circle"
          aria-label="Save language"
          @click="saveEditLanguage"
        >
          <Check class="h-4 w-4" />
        </button>
      </template>
      <template v-else>
        <p class="flex-1 text-sm italic opacity-60">
          {{ word.language || 'No language' }}
        </p>
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-circle"
          aria-label="Edit language"
          @click="startEditLanguage"
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
        :class="{ 'border-info bg-info/10': row.existingId }"
      >
        <div class="flex flex-1 flex-col gap-2">
          <SimilarEntitySelect
            :model-value="row.primary"
            :candidates="candidatesFor(row)"
            field-label="Sentence"
            @update:model-value="updatePrimary(index, $event)"
            @select-existing="(id) => selectExisting(index, id)"
            @blur="checkBlurMatch(index)"
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
        @click="finish(false)"
      >
        Save
      </button>
      <button
        type="button"
        class="btn btn-ghost"
        :disabled="saving"
        @click="finish(true)"
      >
        I don't want to add more examples
      </button>
      <button
        type="button"
        class="btn btn-ghost text-error"
        @click="confirmingDelete = true"
      >
        Delete word
      </button>
    </div>

    <dialog
      class="modal"
      :class="{ 'modal-open': confirmingDelete }"
    >
      <div class="modal-box">
        <h3 class="text-lg font-semibold">
          Delete this word?
        </h3>
        <p class="py-2 opacity-70">
          Its example sentence links will be discarded without saving.
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
